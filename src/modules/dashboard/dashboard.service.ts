import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Property, PropertyDocument, PropertyStatus } from '../properties/schemas/property.schema';
import { Lead, LeadDocument, LeadStatus } from '../leads/schemas/lead.schema';
import { Contact, ContactDocument } from '../contacts/schemas/contact.schema';
import { Opportunity, OpportunityDocument, OpportunityStatus } from '../opportunities/schemas/opportunity.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Property.name) private readonly propertyModel: Model<PropertyDocument>,
    @InjectModel(Lead.name) private readonly leadModel: Model<LeadDocument>,
    @InjectModel(Contact.name) private readonly contactModel: Model<ContactDocument>,
    @InjectModel(Opportunity.name) private readonly opportunityModel: Model<OpportunityDocument>,
  ) { }

  async getStats() {
    // 1. Contacts
    const contactTotal = await this.contactModel.countDocuments({ isDeleted: false }).exec();
    const contactActive = await this.contactModel.countDocuments({ status: 'Active', isDeleted: false }).exec();
    const contactInactive = await this.contactModel.countDocuments({ status: 'Inactive', isDeleted: false }).exec();

    // 2. Leads
    const leadTotal = await this.leadModel.countDocuments().exec();
    const leadOpen = await this.leadModel.countDocuments({ status: LeadStatus.IN_PROGRESS }).exec();
    const leadClosed = await this.leadModel.countDocuments({ status: { $in: [LeadStatus.WON, LeadStatus.LOST] } }).exec();

    // 3. Opportunities
    const oppTotal = await this.opportunityModel.countDocuments().exec();
    const oppActive = await this.opportunityModel.countDocuments({ status: OpportunityStatus.IN_PROGRESS }).exec();
    const oppLost = await this.opportunityModel.countDocuments({ status: OpportunityStatus.LOST }).exec();

    // 4. Won
    const wonTotal = await this.opportunityModel.countDocuments({ status: OpportunityStatus.WON }).exec();
    const wonClosed = wonTotal;
    const wonLost = 0;

    // 5. Property breakdown (Donut)
    // Commercial, Residential, Purchased, Rented
    const propCommercial = await this.propertyModel.countDocuments({
      $or: [
        { propertyType: /Commercial/i },
        { type: /Commercial/i }
      ]
    }).exec();

    const propResidential = await this.propertyModel.countDocuments({
      $or: [
        { propertyType: /Residential/i },
        { type: /Residential|Flat|Apartment|Villa/i }
      ]
    }).exec();

    const propPurchased = await this.propertyModel.countDocuments({
      $or: [
        { status: PropertyStatus.SOLD_OUT },
        { transaction: /Sale|Buy/i }
      ]
    }).exec();

    const propRented = await this.propertyModel.countDocuments({
      transaction: /Rent|Lease/i
    }).exec();

    // 6. Graph this year (Buying vs Selling)
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const endOfYear = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59);

    const buyingAgg = await this.opportunityModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfYear, $lte: endOfYear },
          purpose: 'Buy'
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          count: { $sum: 1 }
        }
      }
    ]).exec();

    const sellingAgg = await this.opportunityModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfYear, $lte: endOfYear },
          purpose: 'Rent/Lease'
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          count: { $sum: 1 }
        }
      }
    ]).exec();

    const buyingData = Array(12).fill(0);
    const sellingData = Array(12).fill(0);

    buyingAgg.forEach(item => {
      const monthIndex = item._id - 1;
      if (monthIndex >= 0 && monthIndex < 12) {
        buyingData[monthIndex] = item.count;
      }
    });

    sellingAgg.forEach(item => {
      const monthIndex = item._id - 1;
      if (monthIndex >= 0 && monthIndex < 12) {
        sellingData[monthIndex] = item.count;
      }
    });

    // Fallback to display pre-filled values if no items are in the DB yet
    const hasRealData = buyingData.some(v => v > 0) || sellingData.some(v => v > 0);
    // if (!hasRealData) {
    //   buyingData.splice(0, 6, 110, 60, 210, 175, 190, 170);
    //   sellingData.splice(0, 6, 70, 80, 55, 78, 95, 135);
    // }

    return {
      contacts: {
        total: contactTotal,
        active: contactActive,
        inactive: contactInactive
      },
      leads: {
        total: leadTotal,
        open: leadOpen,
        closed: leadClosed
      },
      opportunities: {
        total: oppTotal,
        active: oppActive,
        lost: oppLost
      },
      won: {
        total: wonTotal,
        closed: wonClosed,
        lost: wonLost
      },
      propertiesBreakdown: [propCommercial, propResidential, propPurchased, propRented],
      yearlyGraph: {
        buying: buyingData,
        selling: sellingData,
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      }
    };
  }
}
