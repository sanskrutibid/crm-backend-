import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Location, LocationDocument } from './schemas/location.schema';
import { Country, City } from 'country-state-city';

@Injectable()
export class LocationsService implements OnModuleInit {
  constructor(
    @InjectModel(Location.name)
    private readonly locationModel: Model<LocationDocument>,
  ) {}

  async onModuleInit() {
    const count = await this.locationModel.countDocuments().exec();
    if (count === 0) {
      const defaultLocations: Partial<Location>[] = [
        // India (+91) - IN
        { countryCode: '+91', countryIso: 'IN', countryName: 'India', city: 'Nagpur', pincode: '440012', locality: 'Dhantoli' },
        { countryCode: '+91', countryIso: 'IN', countryName: 'India', city: 'Nagpur', pincode: '440022', locality: 'Manish Nagar' },
        { countryCode: '+91', countryIso: 'IN', countryName: 'India', city: 'Nagpur', pincode: '440015', locality: 'Pratap Nagar' },
        { countryCode: '+91', countryIso: 'IN', countryName: 'India', city: 'Nagpur', pincode: '440010', locality: 'Ramdaspeth' },
        
        { countryCode: '+91', countryIso: 'IN', countryName: 'India', city: 'Pune', pincode: '411001', locality: 'Camp' },
        { countryCode: '+91', countryIso: 'IN', countryName: 'India', city: 'Pune', pincode: '411006', locality: 'Yerawada' },
        { countryCode: '+91', countryIso: 'IN', countryName: 'India', city: 'Pune', pincode: '411014', locality: 'Kharadi' },
        { countryCode: '+91', countryIso: 'IN', countryName: 'India', city: 'Pune', pincode: '411021', locality: 'Bavdhan' },
        
        { countryCode: '+91', countryIso: 'IN', countryName: 'India', city: 'Mumbai', pincode: '400001', locality: 'Colaba' },
        { countryCode: '+91', countryIso: 'IN', countryName: 'India', city: 'Mumbai', pincode: '400050', locality: 'Bandra' },
        { countryCode: '+91', countryIso: 'IN', countryName: 'India', city: 'Mumbai', pincode: '400053', locality: 'Andheri' },
        { countryCode: '+91', countryIso: 'IN', countryName: 'India', city: 'Mumbai', pincode: '400092', locality: 'Borivali' },
        
        { countryCode: '+91', countryIso: 'IN', countryName: 'India', city: 'Bangalore', pincode: '560001', locality: 'MG Road' },
        { countryCode: '+91', countryIso: 'IN', countryName: 'India', city: 'Bangalore', pincode: '560066', locality: 'Whitefield' },
        { countryCode: '+91', countryIso: 'IN', countryName: 'India', city: 'Bangalore', pincode: '560037', locality: 'Marathahalli' },

        // United States (+1) - US
        { countryCode: '+1', countryIso: 'US', countryName: 'United States', city: 'New York', pincode: '10001', locality: 'Manhattan' },
        { countryCode: '+1', countryIso: 'US', countryName: 'United States', city: 'New York', pincode: '10002', locality: 'Lower East Side' },
        { countryCode: '+1', countryIso: 'US', countryName: 'United States', city: 'New York', pincode: '11201', locality: 'Brooklyn' },
        
        { countryCode: '+1', countryIso: 'US', countryName: 'United States', city: 'Los Angeles', pincode: '90001', locality: 'South Los Angeles' },
        { countryCode: '+1', countryIso: 'US', countryName: 'United States', city: 'Los Angeles', pincode: '90028', locality: 'Hollywood' },
        { countryCode: '+1', countryIso: 'US', countryName: 'United States', city: 'Los Angeles', pincode: '90210', locality: 'Beverly Hills' },

        // United Arab Emirates (+971) - AE
        { countryCode: '+971', countryIso: 'AE', countryName: 'United Arab Emirates', city: 'Dubai', pincode: '00000', locality: 'Deira' },
        { countryCode: '+971', countryIso: 'AE', countryName: 'United Arab Emirates', city: 'Dubai', pincode: '11111', locality: 'Dubai Marina' },
        { countryCode: '+971', countryIso: 'AE', countryName: 'United Arab Emirates', city: 'Dubai', pincode: '22222', locality: 'Downtown Dubai' },
        
        { countryCode: '+971', countryIso: 'AE', countryName: 'United Arab Emirates', city: 'Abu Dhabi', pincode: '33333', locality: 'Yas Island' },
        { countryCode: '+971', countryIso: 'AE', countryName: 'United Arab Emirates', city: 'Abu Dhabi', pincode: '44444', locality: 'Al Reem Island' },
      ];
      await this.locationModel.insertMany(defaultLocations);
      console.log('🌱 Successfully seeded default location details (countries, cities, pincodes).');
    }
  }

  async getCountries(): Promise<{ code: string; name: string; isoCode: string }[]> {
    const list = Country.getAllCountries().map((c) => {
      const cleanPhone = c.phonecode.startsWith('+') ? c.phonecode : `+${c.phonecode}`;
      return {
        code: cleanPhone,
        name: c.name,
        isoCode: c.isoCode,
      };
    });
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }

  async getCities(countryIso: string): Promise<string[]> {
    const cities = City.getCitiesOfCountry(countryIso);
    if (!cities) return [];
    return cities.map((c) => c.name).sort();
  }

  async getPincodes(
    countryIso: string,
    city: string,
  ): Promise<{ pincode: string; locality: string }[]> {
    const list = await this.locationModel
      .find({
        countryIso,
        city: new RegExp(`^${city}$`, 'i'),
      })
      .select({ pincode: 1, locality: 1, _id: 0 })
      .exec();

    const resultList = list.map(item => ({
      pincode: item.pincode,
      locality: item.locality,
    }));

    if (countryIso === 'IN' && city) {
      try {
        const pincodeData = require('india-pincode-lookup/pincodes.json');
        const cityLower = city.trim().toLowerCase();

        let apiList = pincodeData.filter(
          (e: any) =>
            e.districtName.toLowerCase() === cityLower ||
            e.taluk.toLowerCase() === cityLower,
        );

        // If no exact district or taluk matches, fallback to matching officeName
        if (apiList.length === 0) {
          apiList = pincodeData.filter(
            (e: any) => e.officeName.toLowerCase().includes(cityLower),
          );
        }

        const apiListMapped = apiList.map((po: any) => ({
          pincode: po.pincode.toString(),
          locality: po.officeName,
        }));

        // Merge and deduplicate by combination of locality and pincode
        const seen = new Set(resultList.map(item => `${item.locality.toLowerCase()}_${item.pincode}`));
        for (const item of apiListMapped) {
          const key = `${item.locality.toLowerCase()}_${item.pincode}`;
          if (!seen.has(key)) {
            seen.add(key);
            resultList.push(item);
          }
        }
      } catch (err) {
        console.error('Failed to fetch pincodes from offline dataset:', err);
      }
    }

    return resultList.sort((a, b) => a.locality.localeCompare(b.locality));
  }

  async validatePincode(
    countryIso: string,
    city: string,
    pincode: string,
  ): Promise<{ isValid: boolean; locality?: string }> {
    if (countryIso === 'IN' && pincode) {
      try {
        const pincodeNum = Number(pincode.trim());
        if (!isNaN(pincodeNum)) {
          const pincodeData = require('india-pincode-lookup/pincodes.json');
          const matches = pincodeData.filter((e: any) => e.pincode === pincodeNum);

          if (matches.length > 0) {
            // Find one that matches the city (district or taluk or officeName) or default to the first one
            const cityLower = city.trim().toLowerCase();
            const matchedPo = matches.find(
              (po: any) =>
                po.districtName.toLowerCase() === cityLower ||
                po.taluk.toLowerCase() === cityLower ||
                po.officeName.toLowerCase().includes(cityLower)
            ) || matches[0];

            return { isValid: true, locality: matchedPo.officeName };
          }
        }
      } catch (err) {
        console.error('Failed to validate pincode offline:', err);
      }

      // Fallback to online API
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${pincode.trim()}`);
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data[0]?.Status === 'Success' && Array.isArray(data[0]?.PostOffice)) {
            // Find one that matches the city or default to the first one
            const matchedPo = data[0].PostOffice.find(
              (po: any) =>
                po.District.toLowerCase() === city.toLowerCase() ||
                po.Block.toLowerCase() === city.toLowerCase() ||
                po.Circle.toLowerCase() === city.toLowerCase()
            ) || data[0].PostOffice[0];
            return { isValid: true, locality: matchedPo.Name };
          }
        }
      } catch (err) {
        console.error('Failed to validate pincode via API fallback:', err);
      }
    }

    // Fallback to database validation
    const hasPincodes = await this.locationModel
      .countDocuments({
        countryIso,
        city: new RegExp(`^${city}$`, 'i'),
      })
      .exec();

    if (hasPincodes === 0) {
      return { isValid: true };
    }

    const match = await this.locationModel
      .findOne({
        countryIso,
        city: new RegExp(`^${city}$`, 'i'),
        pincode: pincode.trim(),
      })
      .exec();

    if (match) {
      return { isValid: true, locality: match.locality };
    }
    return { isValid: false };
  }
}
