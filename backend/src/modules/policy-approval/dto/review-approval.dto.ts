import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class ReviewApprovalDto {
  @ApiProperty({ enum: ['APPROVE', 'REJECT'], example: 'APPROVE' })
  @IsEnum(['APPROVE', 'REJECT'])
  decision: 'APPROVE' | 'REJECT';

  @ApiProperty({ example: 'Reviewed and confirmed privacy controls satisfy governance standards.' })
  @IsString()
  @IsNotEmpty()
  reviewNotes: string;
}
