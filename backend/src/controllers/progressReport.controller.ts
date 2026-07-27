import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import progressReportService from '../services/progressReport.service';

const listSkills = catchAsync(async (req: Request, res: Response) => {
  const skills = await progressReportService.listActiveSkills();
  return res.send({ success: true, data: skills });
});

const getInstructorReport = catchAsync(async (req: Request, res: Response) => {
  const data = await progressReportService.getForInstructor(
    String(req.params.id),
    req.drivingUser!.id
  );
  return res.send({ success: true, data });
});

const upsertInstructorReport = catchAsync(async (req: Request, res: Response) => {
  const data = await progressReportService.upsertDraft(
    String(req.params.id),
    req.drivingUser!.id,
    req.body
  );
  return res.send({ success: true, data });
});

const publishReport = catchAsync(async (req: Request, res: Response) => {
  const data = await progressReportService.publish(String(req.params.id), req.drivingUser!.id);
  return res.send({ success: true, data });
});

const unpublishReport = catchAsync(async (req: Request, res: Response) => {
  const data = await progressReportService.unpublish(String(req.params.id), req.drivingUser!.id);
  return res.send({ success: true, data });
});

const getStudentReport = catchAsync(async (req: Request, res: Response) => {
  const data = await progressReportService.getForStudent(
    String(req.params.id),
    req.drivingUser!.id
  );
  return res.send({ success: true, data });
});

const getStudentOverview = catchAsync(async (req: Request, res: Response) => {
  const data = await progressReportService.getOverviewForStudent(req.drivingUser!.id);
  return res.send({ success: true, data });
});

export default {
  listSkills,
  getInstructorReport,
  upsertInstructorReport,
  publishReport,
  unpublishReport,
  getStudentReport,
  getStudentOverview,
};
