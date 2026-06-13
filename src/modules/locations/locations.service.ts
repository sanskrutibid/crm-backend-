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
    return list;
  }

  async validatePincode(
    countryIso: string,
    city: string,
    pincode: string,
  ): Promise<{ isValid: boolean; locality?: string }> {
    // Check if there are any pincodes mapped in our database for this city
    const hasPincodes = await this.locationModel
      .countDocuments({
        countryIso,
        city: new RegExp(`^${city}$`, 'i'),
      })
      .exec();

    if (hasPincodes === 0) {
      // If we don't have database records for this city, consider it valid
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
