import {
  Injectable,
  Logger,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import {
  PincodeLocality,
  PincodeLocalityDocument,
} from './localities.schema';

@Injectable()
export class LocalitiesService {

  private readonly logger =
    new Logger(LocalitiesService.name);

  constructor(
    @InjectModel(PincodeLocality.name)
    private readonly localityModel: Model<PincodeLocalityDocument>,
  ) {}

  // ============================================================
  // SIMPLE IN-MEMORY CACHE
  // city -> localities
  //
  // Only non-empty results are cached.
  // ============================================================

  private cache =
    new Map<
      string,
      {
        at: number;
        data: string[];
      }
    >();

  private readonly CACHE_TTL_MS =
    24 * 60 * 60 * 1000;

  private readonly REQUEST_TIMEOUT_MS =
    10000;

  private readonly MAX_RESULTS =
    1000;

  // ============================================================
  // OLD / NEW CITY NAMES
  // ============================================================

  private readonly cityAliases:
    Record<string, string[]> = {

    bangalore: [
      'bengaluru',
      'bangalore',
    ],

    bengaluru: [
      'bengaluru',
      'bangalore',
    ],

    gurgaon: [
      'gurugram',
      'gurgaon',
    ],

    gurugram: [
      'gurugram',
      'gurgaon',
    ],

    calcutta: [
      'kolkata',
      'calcutta',
    ],

    kolkata: [
      'kolkata',
      'calcutta',
    ],

    bombay: [
      'mumbai',
      'bombay',
    ],

    mumbai: [
      'mumbai',
      'bombay',
    ],

    madras: [
      'chennai',
      'madras',
    ],

    chennai: [
      'chennai',
      'madras',
    ],

    poona: [
      'pune',
      'poona',
    ],

    pune: [
      'pune',
      'poona',
    ],

    baroda: [
      'vadodara',
      'baroda',
    ],

    vadodara: [
      'vadodara',
      'baroda',
    ],

    trivandrum: [
      'thiruvananthapuram',
      'trivandrum',
    ],

    thiruvananthapuram: [
      'thiruvananthapuram',
      'trivandrum',
    ],
  };

  // ============================================================
  // GET LOCALITIES OF A CITY
  //
  // Flow:
  //
  // 1. Check cache
  // 2. Search MongoDB using city field
  // 3. Try legacy MongoDB fields for old records
  // 4. India Post API fallback
  // 5. Try city aliases if necessary
  // 6. Cache non-empty result
  //
  // There is NO hardcoded Nagpur locality list.
  // ============================================================

  async getLocalities(
    city: string,
  ): Promise<string[]> {

    const cityName =
      (city || '').trim();

    if (!cityName) {
      return [];
    }

    const key =
      cityName.toLowerCase();

    // ==========================================================
    // CACHE
    // ==========================================================

    const hit =
      this.cache.get(key);

    if (
      hit &&
      Date.now() - hit.at <
        this.CACHE_TTL_MS
    ) {

      this.logger.debug(
        `Returning cached localities for "${cityName}"`,
      );

      return [
        ...hit.data,
      ];
    }

    // ==========================================================
    // 1. DATABASE
    //
    // MongoDB is the primary source.
    //
    // This ensures:
    //
    // Nagpur -> Nagpur localities
    // Pune   -> Pune localities
    // Mumbai -> Mumbai localities
    // ==========================================================

    let names =
      await this.fromDatabase(
        cityName,
      );

    // ==========================================================
    // 2. INDIA POST API FALLBACK
    //
    // Only used when MongoDB does not have the city.
    // ==========================================================

    if (!names.length) {

      this.logger.debug(
        `No database localities found for "${cityName}". Trying India Post.`,
      );

      names =
        await this.fromIndiaPostApi(
          cityName,
        );
    }

    // ==========================================================
    // 3. CITY ALIASES
    //
    // Example:
    //
    // Bengaluru -> Bangalore
    // Bangalore -> Bengaluru
    // Mumbai -> Bombay
    // Pune -> Poona
    // ==========================================================

    if (!names.length) {

      const aliases =
        this.cityAliases[
          cityName.toLowerCase()
        ] || [];

      for (
        const alias of aliases
      ) {

        if (
          alias.toLowerCase() ===
          cityName.toLowerCase()
        ) {
          continue;
        }

        // First try database with alias
        names =
          await this.fromDatabase(
            alias,
          );

        if (names.length) {
          break;
        }

        // Then try India Post with alias
        this.logger.debug(
          `Trying city alias "${alias}" for "${cityName}"`,
        );

        names =
          await this.fromIndiaPostApi(
            alias,
          );

        if (names.length) {
          break;
        }
      }
    }

    // ==========================================================
    // CACHE ONLY NON-EMPTY RESULTS
    // ==========================================================

    if (names.length) {

      this.cache.set(
        key,
        {
          at: Date.now(),
          data: names,
        },
      );
    }

    return [
      ...names,
    ];
  }

  // ============================================================
  // FROM DATABASE
  //
  // PRIMARY SOURCE
  //
  // NEW DATA:
  //
  // city = "Nagpur"
  //
  // officeName = "Indl. Area Nagpur"
  //
  // OLD DATA:
  //
  // Records without city are supported through:
  // district / taluk / division
  // ============================================================

  private async fromDatabase(
    cityName: string,
  ): Promise<string[]> {

    try {

      const key =
        cityName
          .trim()
          .toLowerCase();

      const terms =
        this.cityAliases[key] ||
        [key];

      const patterns =
        terms.map(
          term =>
            new RegExp(
              `^${this.escapeRegex(
                term.trim(),
              )}$`,
              'i',
            ),
        );

      // ========================================================
      // NEW SCHEMA
      //
      // Search using city field first.
      // ========================================================

      const cityFilter = {
        city: {
          $in: patterns,
        },
      };

      let offices: string[] =
        await this.localityModel.distinct(
          'officeName',
          cityFilter,
        );

      if (offices.length) {

        this.logger.log(
          `Found ${offices.length} database localities using city field for "${cityName}"`,
        );

        return this.cleanNames(
          offices,
        );
      }

      // ========================================================
      // OLD DATA FALLBACK
      //
      // Existing records may not yet have city.
      // ========================================================

      const legacyFilter = {
        $or: [
          {
            district: {
              $in: patterns,
            },
          },
          {
            taluk: {
              $in: patterns,
            },
          },
          {
            division: {
              $in: patterns,
            },
          },
        ],
      };

      offices =
        await this.localityModel.distinct(
          'officeName',
          legacyFilter,
        );

      if (offices.length) {

        this.logger.log(
          `Found ${offices.length} legacy database localities for "${cityName}"`,
        );
      }

      if (!offices.length) {

        const total =
          await this.localityModel
            .estimatedDocumentCount();

        if (total === 0) {

          this.logger.warn(
            'pincode_localities collection is empty. Run the locality import script.',
          );
        }
      }

      return this.cleanNames(
        offices,
      );

    } catch (error: any) {

      this.logger.error(
        `Database locality lookup failed for "${cityName}": ${
          error?.message || error
        }`,
      );

      return [];
    }
  }

  // ============================================================
  // FROM INDIA POST LIVE API
  //
  // FALLBACK ONLY
  //
  // Example:
  //
  // /postoffice/Pune
  // /postoffice/Nagpur
  // /postoffice/Mumbai
  // /postoffice/Chennai
  // ============================================================

  private async fromIndiaPostApi(
    cityName: string,
  ): Promise<string[]> {

    const controller =
      new AbortController();

    const timer =
      setTimeout(
        () =>
          controller.abort(),
        this.REQUEST_TIMEOUT_MS,
      );

    try {

      const url =
        `https://api.postalpincode.in/postoffice/${encodeURIComponent(
          cityName,
        )}`;

      this.logger.log(
        `Fetching localities for city "${cityName}" from India Post`,
      );

      const response =
        await fetch(
          url,
          {
            method: 'GET',

            signal:
              controller.signal,

            headers: {
              Accept:
                'application/json',

              'User-Agent':
                'CRM-Backend',
            },
          },
        );

      if (!response.ok) {

        throw new Error(
          `India Post responded with HTTP ${response.status}`,
        );
      }

      const json: any =
        await response.json();

      // ========================================================
      // INDIA POST RESPONSE
      //
      // [
      //   {
      //     "Message": "...",
      //     "Status": "Success",
      //     "PostOffice": [...]
      //   }
      // ]
      // ========================================================

      const postOffices =
        Array.isArray(
          json?.[0]?.PostOffice,
        )
          ? json[0].PostOffice
          : [];

      const offices: string[] =
        postOffices
          .map(
            (office: any) =>
              String(
                office?.Name || '',
              ).trim(),
          )
          .filter(
            (name: string) =>
              !!name,
          );

      const names =
        this.cleanNames(
          offices,
        );

      this.logger.log(
        `Found ${names.length} localities for city "${cityName}" from India Post`,
      );

      return names;

    } catch (error: any) {

      this.logger.error(
        `India Post API failed for "${cityName}": ${
          error?.message || error
        }`,
      );

      return [];

    } finally {

      clearTimeout(timer);
    }
  }

  // ============================================================
  // CLEAN LOCALITY NAMES
  // ============================================================

  private cleanNames(
    offices: string[],
  ): string[] {

    const names =
      [
        ...new Set(
          offices
            .map(
              (name: string) =>
                String(name || '')
                  .replace(
                    /\s*(G\.P\.O\.?|H\.O|S\.O|B\.O)\s*$/i,
                    '',
                  )
                  .trim(),
            )
            .filter(
              (name: string) =>
                !!name,
            ),
        ),
      ].sort(
        (
          a,
          b,
        ) =>
          a.localeCompare(
            b,
            'en',
            {
              sensitivity:
                'base',
            },
          ),
      );

    return names.slice(
      0,
      this.MAX_RESULTS,
    );
  }

  // ============================================================
  // ESCAPE REGEX
  // ============================================================

  private escapeRegex(
    value: string,
  ): string {

    return value.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&',
    );
  }
}