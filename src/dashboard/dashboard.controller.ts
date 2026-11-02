import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('admin-dashboard')
@Controller('admin/dashboard')
@UseGuards(AuthGuard)
export class DashboardController {
  constructor(private svc: DashboardService) {}
  @Get('summary') summary() { return this.svc.summary(); }
  @Get('recent-jobs') recent() { return this.svc.recentJobs(); }
}
