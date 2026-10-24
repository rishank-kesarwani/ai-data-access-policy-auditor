import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root & discovery', () => {
    it('should return service discovery payload', () => {
      const res = appController.getRoot();
      expect(res.status).toBe('UP');
      expect(res.application).toBe('AI Data Access & Policy Auditor');
      expect(res.apiPrefix).toBe('/api/v1');
      expect(res.health).toBe('/health');
    });

    it('should handle favicon requests gracefully', () => {
      expect(appController.getFavicon()).toBeUndefined();
    });
  });
});
