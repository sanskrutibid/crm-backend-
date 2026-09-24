import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import * as https from 'https';

import {
  City,
  CityDocument,
} from './cities.schema';

@Injectable()
export class CitiesService {

  constructor(
    @InjectModel(City.name)
    private readonly cityModel: Model<CityDocument>,
  ) {}

  /**
   * Get all active cities from MongoDB.
   *
   * If MongoDB does not contain any cities,
   * automatically syncs them from CountriesNow.
   */
  async getCities(): Promise<string[]> {

    try {

      const cities =
        await this.cityModel
          .find({
            isActive: true,
          })
          .select({
            _id: 0,
            name: 1,
          })
          .sort({
            name: 1,
          })
          .lean();

      /**
       * If cities already exist in MongoDB,
       * return them directly.
       */
      if (
        Array.isArray(cities) &&
        cities.length > 0
      ) {

        return cities
          .map(
            city =>
              String(city.name).trim(),
          )
          .filter(
            city =>
              !!city,
          );
      }

      /**
       * No cities in MongoDB.
       *
       * Load them from CountriesNow.
       */
      return await this.syncCities();

    } catch (error) {

      console.error(
        'Failed to get cities:',
        error,
      );

      if (
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Unable to load cities',
      );
    }
  }

  /**
   * Fetch Indian cities from CountriesNow
   * and save them into MongoDB.
   */
  async syncCities(): Promise<string[]> {

    const url =
      'https://countriesnow.space/api/v0.1/countries';

    try {

      console.log(
        'Loading Indian cities from CountriesNow...',
      );

      const result =
        await this.getJson(url);

      /**
       * CountriesNow response:
       *
       * {
       *   data: [
       *     {
       *       country: "India",
       *       cities: [...]
       *     }
       *   ]
       * }
       */
      const countries =
        Array.isArray(result?.data)
          ? result.data
          : [];

      /**
       * Find India.
       */
      const india =
        countries.find(
          (country: any) =>
            String(
              country?.country || '',
            )
              .trim()
              .toLowerCase() === 'india',
        );

      if (
        !india ||
        !Array.isArray(india.cities)
      ) {

        throw new Error(
          'India cities were not found in CountriesNow response',
        );
      }

      /**
       * Clean and normalize cities.
       */
      const cityNames =
        india.cities
          .map(
            (city: any) =>
              String(city || '').trim(),
          )
          .filter(
            (city: string) =>
              !!city,
          )
          .filter(
            (
              city: string,
              index: number,
              array: string[],
            ) =>
              array.findIndex(
                item =>
                  item.toLowerCase() ===
                  city.toLowerCase(),
              ) === index,
          )
          .sort(
            (
              a: string,
              b: string,
            ) =>
              a.localeCompare(
                b,
                'en',
                {
                  sensitivity: 'base',
                },
              ),
          );

      if (cityNames.length === 0) {

        throw new Error(
          'No Indian cities found',
        );
      }

      /**
       * Save cities to MongoDB.
       *
       * updateOne + upsert prevents duplicate
       * city records when sync is called multiple times.
       */
      for (const cityName of cityNames) {

        await this.cityModel.updateOne(
          {
            name: cityName,
          },
          {
            $set: {
              name: cityName,
              country: 'India',
              isActive: true,
            },
          },
          {
            upsert: true,
          },
        );
      }

      /**
       * Disable cities that are no longer
       * returned by the external API.
       */
      await this.cityModel.updateMany(
        {
          name: {
            $nin: cityNames,
          },
        },
        {
          $set: {
            isActive: false,
          },
        },
      );

      console.log(
        `Indian cities synced successfully: ${cityNames.length}`,
      );

      return cityNames;

    } catch (error) {

      console.error(
        'Failed to sync Indian cities:',
        error,
      );

      throw new InternalServerErrorException(
        'Unable to sync Indian cities',
      );
    }
  }

  /**
   * Simple HTTPS JSON helper.
   *
   * No axios package is required.
   */
  private getJson(
    url: string,
  ): Promise<any> {

    return new Promise(
      (
        resolve,
        reject,
      ) => {

        const request =
          https.get(
            url,
            {
              headers: {
                Accept:
                  'application/json',

                'User-Agent':
                  'CRM-Backend',
              },
            },

            response => {

              let body = '';

              response.setEncoding(
                'utf8',
              );

              response.on(
                'data',
                chunk => {
                  body += chunk;
                },
              );

              response.on(
                'end',
                () => {

                  const statusCode =
                    response.statusCode || 0;

                  if (
                    statusCode < 200 ||
                    statusCode >= 300
                  ) {

                    reject(
                      new Error(
                        `CountriesNow API returned status ${statusCode}`,
                      ),
                    );

                    return;
                  }

                  try {

                    const json =
                      JSON.parse(body);

                    resolve(json);

                  } catch (error) {

                    reject(
                      new Error(
                        'Invalid JSON received from CountriesNow API',
                      ),
                    );
                  }
                },
              );
            },
          );

        request.on(
          'error',
          error => {
            reject(error);
          },
        );

        request.setTimeout(
          30000,
          () => {

            request.destroy();

            reject(
              new Error(
                'CountriesNow API request timed out',
              ),
            );
          },
        );
      },
    );
  }
}