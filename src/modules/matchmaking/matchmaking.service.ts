import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Opportunity, OpportunityDocument } from '../opportunities/schemas/opportunity.schema';
import { Property, PropertyDocument } from '../properties/schemas/property.schema';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';

@Injectable()
export class MatchmakingService {
  constructor(
    @InjectModel(Opportunity.name)
    private readonly opportunityModel: Model<OpportunityDocument>,
    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
  ) {}

  /**
   * Helper: Calculates the Haversine distance between two coordinates in kilometers.
   */
  private getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Helper: Checks if a property type / lookingFor matches compatibility rules.
   */
  private isTypeCompatible(typeA: string, typeB: string): boolean {
    if (!typeA || !typeB) return true; // Resilient fallback
    const normA = typeA.trim().toLowerCase();
    const normB = typeB.trim().toLowerCase();
    return normA.includes(normB) || normB.includes(normA);
  }

  /**
   * Helper: Checks if opportunity purpose and property 'fo' are compatible.
   */
  private isPurposeCompatible(oppPurpose: string, propFo: string): boolean {
    if (!oppPurpose || !propFo) return true; // Resilient fallback
    const p = oppPurpose.trim().toLowerCase();
    const f = propFo.trim().toLowerCase();

    if (p === 'buy') {
      return f === 'sell' || f === 'buy' || f === 'resale' || f === 'available';
    }
    if (p === 'rent/lease') {
      return f === 'rent' || f === 'lease' || f === 'rent/lease';
    }
    if (p === 'pg') {
      return f === 'pg';
    }
    return true; // Match other purposes by default
  }

  /**
   * Helper: Location / Distance compatibility checker.
   */
  private isLocationCompatible(
    locA: { lat?: number; lon?: number; city?: string; locality?: string },
    locB: { lat?: number; lon?: number; city?: string; locality?: string },
    radiusKm: number,
  ): boolean {
    // If coordinates are present, use Haversine distance
    if (locA.lat != null && locA.lon != null && locB.lat != null && locB.lon != null) {
      if (locA.lat !== 0 && locA.lon !== 0 && locB.lat !== 0 && locB.lon !== 0) {
        return this.getDistanceKm(locA.lat, locA.lon, locB.lat, locB.lon) <= radiusKm;
      }
    }

    // Fallback: check city and locality
    const cityA = (locA.city || '').trim().toLowerCase();
    const cityB = (locB.city || '').trim().toLowerCase();
    if (cityA && cityB && cityA !== cityB) return false;

    const localityA = (locA.locality || '').trim().toLowerCase();
    const localityB = (locB.locality || '').trim().toLowerCase();
    if (localityA && localityB) {
      return localityA.includes(localityB) || localityB.includes(localityA);
    }

    return true; // If one is missing details, assume compatible
  }

  /**
   * 1. Find all matching entities for a given Opportunity ID.
   */
  async findMatchesForOpportunity(
    opportunityId: string,
    radiusKm = 5,
    priceTolerancePct = 10,
    areaTolerancePct = 10,
  ) {
    const opp = await this.opportunityModel.findById(opportunityId).populate('contactId').exec();
    if (!opp) {
      throw new NotFoundException(`Opportunity with ID ${opportunityId} not found`);
    }

    const priceTol = priceTolerancePct / 100;
    const minBudgetTol = opp.minBudget * (1 - priceTol);
    const maxBudgetTol = opp.maxBudget * (1 + priceTol);

    const areaTol = areaTolerancePct / 100;
    const minAreaTol = opp.minArea * (1 - areaTol);
    const maxAreaTol = opp.maxArea * (1 + areaTol);

    // Get all candidate opportunities (excluding this one)
    const allOpps = await this.opportunityModel
      .find({ _id: { $ne: opportunityId } })
      .populate('contactId')
      .exec();

    const matchingOpportunities = allOpps.filter((other) => {
      // Type check
      if (!this.isTypeCompatible(opp.lookingFor, other.lookingFor)) return false;

      // Purpose compatibility (complementary matching)
      const purposeA = opp.purpose.toLowerCase();
      const purposeB = other.purpose.toLowerCase();
      const isComplementary =
        (purposeA === 'buy' && purposeB === 'sell') ||
        (purposeA === 'sell' && purposeB === 'buy') ||
        (purposeA === 'rent/lease' && (purposeB === 'rent' || purposeB === 'lease' || purposeB === 'rent/lease')) ||
        purposeA === purposeB; // fallback match same
      if (!isComplementary) return false;

      // Location match
      if (
        !this.isLocationCompatible(
          { lat: opp.latitude, lon: opp.longitude, city: opp.city, locality: opp.locality },
          { lat: other.latitude, lon: other.longitude, city: other.city, locality: other.locality },
          radiusKm,
        )
      ) {
        return false;
      }

      // Budget overlap check
      const maxBudgetOther = other.maxBudget * (1 + priceTol);
      const minBudgetOther = other.minBudget * (1 - priceTol);
      if (minBudgetTol > maxBudgetOther || maxBudgetTol < minBudgetOther) return false;

      // Area overlap check
      const maxAreaOther = other.maxArea * (1 + areaTol);
      const minAreaOther = other.minArea * (1 - areaTol);
      if (minAreaTol > maxAreaOther || maxAreaTol < minAreaOther) return false;

      return true;
    });

    // Get matching Properties
    const allProps = await this.propertyModel.find().populate('ownerLandlord').exec();
    const matchingProperties = allProps.filter((prop) => {
      // Type check
      const propType = prop.propertyType || prop.type || '';
      if (!this.isTypeCompatible(opp.lookingFor, propType)) return false;

      // Purpose check
      const propFo = prop.fo || '';
      if (!this.isPurposeCompatible(opp.purpose, propFo)) return false;

      // Location check
      if (
        !this.isLocationCompatible(
          { lat: opp.latitude, lon: opp.longitude, city: opp.city, locality: opp.locality },
          { lat: prop.latitude, lon: prop.longitude, city: prop.city, locality: prop.locality },
          radiusKm,
        )
      ) {
        return false;
      }

      // Price check
      const propPrice = prop.expectedPrice || prop.rentPerMonth || (prop.price ? parseFloat(prop.price) : NaN);
      if (!isNaN(propPrice)) {
        if (propPrice < minBudgetTol || propPrice > maxBudgetTol) return false;
      }

      // Area check
      const propArea = prop.area || prop.sqft || prop.builtUpArea || prop.carpetArea;
      if (propArea != null) {
        if (propArea < minAreaTol || propArea > maxAreaTol) return false;
      }

      return true;
    });

    // Get matching Projects
    const allProjects = await this.projectModel.find().populate('contactId').exec();
    const matchingProjects = allProjects.filter((proj) => {
      // Type check
      if (!this.isTypeCompatible(opp.lookingFor, proj.type || '')) return false;

      // Location check
      if (
        !this.isLocationCompatible(
          { lat: opp.latitude, lon: opp.longitude, city: opp.city, locality: opp.locality },
          { lat: proj.latitude, lon: proj.longitude, city: proj.city, locality: proj.locality },
          radiusKm,
        )
      ) {
        return false;
      }

      // Price check
      if (proj.price != null) {
        if (proj.price < minBudgetTol || proj.price > maxBudgetTol) return false;
      }

      // Area check
      if (proj.projectArea != null) {
        if (proj.projectArea < minAreaTol || proj.projectArea > maxAreaTol) return false;
      }

      return true;
    });

    return {
      opportunity: opp,
      matchingOpportunities,
      matchingProperties,
      matchingProjects,
    };
  }

  /**
   * 2. Find all matching Opportunities for a given Property ID.
   */
  async findMatchesForProperty(
    propertyId: string,
    radiusKm = 5,
    priceTolerancePct = 10,
    areaTolerancePct = 10,
  ) {
    const prop = await this.propertyModel.findById(propertyId).populate('ownerLandlord').exec();
    if (!prop) {
      throw new NotFoundException(`Property with ID ${propertyId} not found`);
    }

    const priceTol = priceTolerancePct / 100;
    const areaTol = areaTolerancePct / 100;

    const allOpps = await this.opportunityModel.find().populate('contactId').exec();
    const matchingOpportunities = allOpps.filter((opp) => {
      // Type check
      const propType = prop.propertyType || prop.type || '';
      if (!this.isTypeCompatible(opp.lookingFor, propType)) return false;

      // Purpose check
      const propFo = prop.fo || '';
      if (!this.isPurposeCompatible(opp.purpose, propFo)) return false;

      // Location check
      if (
        !this.isLocationCompatible(
          { lat: opp.latitude, lon: opp.longitude, city: opp.city, locality: opp.locality },
          { lat: prop.latitude, lon: prop.longitude, city: prop.city, locality: prop.locality },
          radiusKm,
        )
      ) {
        return false;
      }

      // Price check
      const propPrice = prop.expectedPrice || prop.rentPerMonth || (prop.price ? parseFloat(prop.price) : NaN);
      if (!isNaN(propPrice)) {
        const minBudgetTol = opp.minBudget * (1 - priceTol);
        const maxBudgetTol = opp.maxBudget * (1 + priceTol);
        if (propPrice < minBudgetTol || propPrice > maxBudgetTol) return false;
      }

      // Area check
      const propArea = prop.area || prop.sqft || prop.builtUpArea || prop.carpetArea;
      if (propArea != null) {
        const minAreaTol = opp.minArea * (1 - areaTol);
        const maxAreaTol = opp.maxArea * (1 + areaTol);
        if (propArea < minAreaTol || propArea > maxAreaTol) return false;
      }

      return true;
    });

    return {
      property: prop,
      matchingOpportunities,
    };
  }

  /**
   * 3. Find all matching Opportunities for a given Project ID.
   */
  async findMatchesForProject(
    projectId: string,
    radiusKm = 5,
    priceTolerancePct = 10,
    areaTolerancePct = 10,
  ) {
    const proj = await this.projectModel.findById(projectId).populate('contactId').exec();
    if (!proj) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const priceTol = priceTolerancePct / 100;
    const areaTol = areaTolerancePct / 100;

    const allOpps = await this.opportunityModel.find().populate('contactId').exec();
    const matchingOpportunities = allOpps.filter((opp) => {
      // Type check
      if (!this.isTypeCompatible(opp.lookingFor, proj.type || '')) return false;

      // Location check
      if (
        !this.isLocationCompatible(
          { lat: opp.latitude, lon: opp.longitude, city: opp.city, locality: opp.locality },
          { lat: proj.latitude, lon: proj.longitude, city: proj.city, locality: proj.locality },
          radiusKm,
        )
      ) {
        return false;
      }

      // Price check
      if (proj.price != null) {
        const minBudgetTol = opp.minBudget * (1 - priceTol);
        const maxBudgetTol = opp.maxBudget * (1 + priceTol);
        if (proj.price < minBudgetTol || proj.price > maxBudgetTol) return false;
      }

      // Area check
      if (proj.projectArea != null) {
        const minAreaTol = opp.minArea * (1 - areaTol);
        const maxAreaTol = opp.maxArea * (1 + areaTol);
        if (proj.projectArea < minAreaTol || proj.projectArea > maxAreaTol) return false;
      }

      return true;
    });

    return {
      project: proj,
      matchingOpportunities,
    };
  }
}
