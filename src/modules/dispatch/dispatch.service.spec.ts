import { Test, TestingModule } from '@nestjs/testing';
import { DispatchService } from './dispatch.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Role, RideRequestStatus } from '@prisma/client';

describe('DispatchService', () => {
  let service: DispatchService;
  let prisma: PrismaService;

  const mockRideId = '550e8400-e29b-41d4-a716-446655440000';
  const mockParamedicId = '550e8400-e29b-41d4-a716-446655440001';
  const mockUserId = '550e8400-e29b-41d4-a716-446655440002';

  const mockParamedic = {
    id: mockParamedicId,
    name: 'Dr. Test',
    email: 'test@resqlink.com',
    role: Role.PARAMEDIC,
  };

  const mockRide = {
    id: mockRideId,
    userId: mockUserId,
    status: RideRequestStatus.CREATED,
    assignedParamedicId: null,
    assignedParamedic: null,
    user: { name: 'Patient', id: mockUserId },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DispatchService,
        {
          provide: PrismaService,
          useValue: {
            rideRequest: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<DispatchService>(DispatchService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('assignRideToParamedic', () => {
    it('should assign valid paramedic to ride', async () => {
      (prisma.rideRequest.findUnique as jest.Mock).mockResolvedValue(mockRide);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockParamedic);
      (prisma.rideRequest.update as jest.Mock).mockResolvedValue({
        ...mockRide,
        assignedParamedicId: mockParamedicId,
        status: RideRequestStatus.WAITING_DRIVER_ACCEPT,
      });

      const result = await service.assignRideToParamedic(mockRideId, mockParamedicId);

      expect(result.assignedParamedicId).toBe(mockParamedicId);
      expect(result.status).toBe(RideRequestStatus.WAITING_DRIVER_ACCEPT);
      expect(prisma.rideRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockRideId },
          data: expect.objectContaining({
            assignedParamedicId: mockParamedicId,
            status: RideRequestStatus.WAITING_DRIVER_ACCEPT,
          }),
        }),
      );
    });

    it('should throw NotFoundException if ride does not exist', async () => {
      (prisma.rideRequest.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.assignRideToParamedic(mockRideId, mockParamedicId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if paramedic does not exist', async () => {
      (prisma.rideRequest.findUnique as jest.Mock).mockResolvedValue(mockRide);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.assignRideToParamedic(mockRideId, mockParamedicId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user is not a paramedic', async () => {
      (prisma.rideRequest.findUnique as jest.Mock).mockResolvedValue(mockRide);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockParamedic,
        role: Role.USER,
      });

      await expect(
        service.assignRideToParamedic(mockRideId, mockParamedicId),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
