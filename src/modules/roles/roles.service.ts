import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, RoleDocument } from './schemas/role.schema';

const PERMISSION_SCHEMA = [
  {
    id: 'audit',
    permissions: ['view', 'add', 'edit', 'delete'],
  },
  {
    id: 'account',
    permissions: ['view', 'add', 'edit', 'delete', 'transfer', 'history'],
  },
  {
    id: 'lead',
    permissions: [
      'view',
      'add',
      'edit',
      'delete',
      'transfer',
      'history',
      'followup',
      'status',
      'reassign',
      'duplicate',
    ],
  },
  {
    id: 'opportunity',
    permissions: [
      'view',
      'add',
      'edit',
      'delete',
      'transfer',
      'history',
      'followup',
      'status',
      'reassign',
    ],
  },
  {
    id: 'property',
    permissions: [
      'view',
      'add',
      'edit',
      'delete',
      'transfer',
      'history',
      'followup',
      'status',
      'reassign',
    ],
  },
  {
    id: 'project',
    permissions: ['view', 'add', 'edit', 'delete', 'transfer'],
  },
  {
    id: 'document',
    permissions: ['view', 'add', 'edit', 'delete'],
  },
  {
    id: 'agreement',
    permissions: ['view', 'add', 'edit', 'delete'],
  },
  {
    id: 'import',
    permissions: ['reports'],
  },
  {
    id: 'siteVisits',
    permissions: ['view', 'add', 'delete'],
  },
  {
    id: 'marketing',
    permissions: ['marketing_campaign'],
  },
  {
    id: 'user',
    permissions: ['view'],
  },
  {
    id: 'other',
    permissions: [
      'activity',
      'dataDisposal',
      'agentCommission',
      'dashboard',
      'websitePublish',
      'groupTransfer',
      'scheduleInteraction',
      'communication',
      'limitContacts',
      'courierBooking',
      'tasking',
      'requiredLocation',
      'dndBypass',
      'attendanceSelfie',
    ],
  },
  {
    id: 'controlPanel',
    permissions: ['setup', 'apiConfiguration', 'dataSecurityAudit'],
  },
];

const createInitialPermissions = (roleType: string): Record<string, boolean> => {
  const perms: Record<string, boolean> = {};
  PERMISSION_SCHEMA.forEach((group) => {
    group.permissions.forEach((p) => {
      const key = `${group.id}_${p}`;
      if (roleType === 'admin') {
        perms[key] = true;
      } else if (roleType === 'broker') {
        const readWrite = [
          'view',
          'add',
          'edit',
          'transfer',
          'history',
          'followup',
          'status',
          'reassign',
          'duplicate',
          'reports',
          'marketing_campaign',
          'activity',
          'dashboard',
          'communication',
          'tasking',
        ];
        perms[key] = readWrite.includes(p) && group.id !== 'controlPanel';
      } else if (roleType === 'editor') {
        const readWrite = [
          'view',
          'add',
          'edit',
          'history',
          'activity',
          'dashboard',
        ];
        perms[key] = readWrite.includes(p) && group.id !== 'controlPanel';
      } else if (roleType === 'buyer') {
        perms[key] = ['view', 'dashboard'].includes(p);
      } else {
        perms[key] = false;
      }
    });
  });
  return perms;
};

@Injectable()
export class RolesService implements OnModuleInit {
  constructor(
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
  ) {}

  async onModuleInit() {
    const count = await this.roleModel.countDocuments().exec();
    if (count === 0) {
      const initialRoles = [
        {
          name: 'Super Admin',
          permissions: createInitialPermissions('admin'),
          isSystem: true,
        },
        {
          name: 'Agent/Broker',
          permissions: createInitialPermissions('broker'),
          isSystem: true,
        },
        {
          name: 'Editor',
          permissions: createInitialPermissions('editor'),
          isSystem: true,
        },
        {
          name: 'Client/Buyer',
          permissions: createInitialPermissions('buyer'),
          isSystem: true,
        },
      ];
      await this.roleModel.insertMany(initialRoles);
      console.log('🌱 seeded default roles database collection successfully.');
    }
  }

  async findAll(): Promise<RoleDocument[]> {
    return this.roleModel.find().exec();
  }

  async findByName(name: string): Promise<RoleDocument | null> {
    return this.roleModel.findOne({ name }).exec();
  }

  async createOrUpdate(roleData: {
    name: string;
    permissions: Record<string, boolean>;
    isSystem?: boolean;
  }): Promise<RoleDocument> {
    const existing = await this.findByName(roleData.name);
    if (existing) {
      existing.permissions = new Map(Object.entries(roleData.permissions));
      return existing.save();
    }
    const newRole = new this.roleModel({
      name: roleData.name,
      permissions: new Map(Object.entries(roleData.permissions)),
      isSystem: roleData.isSystem ?? false,
    });
    return newRole.save();
  }

  async delete(name: string): Promise<void> {
    const existing = await this.findByName(name);
    if (existing && !existing.isSystem) {
      await this.roleModel.deleteOne({ name }).exec();
    }
  }
}
