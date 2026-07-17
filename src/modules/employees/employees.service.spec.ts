import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { EmployeesService } from './employees.service';
import { Employee } from './schemas/employee.schema';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('EmployeesService', () => {
  let service: EmployeesService;
  let mockEmployeeModel: any;

  beforeEach(async () => {
    mockEmployeeModel = {
      findOne: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      findByIdAndDelete: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesService,
        {
          provide: getModelToken(Employee.name),
          useValue: mockEmployeeModel,
        },
      ],
    }).compile();

    service = module.get<EmployeesService>(EmployeesService);
  });

  describe('generateNextEmployeeId', () => {
    it('should return EMP001 if no employee exists', async () => {
      mockEmployeeModel.findOne.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      const nextId = await service.generateNextEmployeeId();
      expect(nextId).toBe('EMP001');
    });

    it('should increment sequential employeeId correctly', async () => {
      mockEmployeeModel.findOne.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({ employeeId: 'EMP003' }),
        }),
      });

      const nextId = await service.generateNextEmployeeId();
      expect(nextId).toBe('EMP004');
    });

    it('should pad employeeId sequence to 3 digits', async () => {
      mockEmployeeModel.findOne.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({ employeeId: 'EMP099' }),
        }),
      });

      const nextId = await service.generateNextEmployeeId();
      expect(nextId).toBe('EMP100');
    });

    it('should fallback and increment even if last ID does not follow exact standard format', async () => {
      mockEmployeeModel.findOne.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({ employeeId: 'E-12' }),
        }),
      });

      const nextId = await service.generateNextEmployeeId();
      expect(nextId).toBe('EMP013');
    });
  });
});
