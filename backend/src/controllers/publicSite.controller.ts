import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import publicSiteService from '../services/publicSite.service';

const handlePublicSiteError = (res: Response, error: unknown) => {
  if (error instanceof publicSiteService.PublicSiteError) {
    const body: { success: false; error: string; details?: unknown } = {
      success: false,
      error: error.message,
    };
    if (error.details) {
      body.details = error.details;
    }
    return res.status(error.statusCode).send(body);
  }

  return res.status(500).send({ success: false, error: 'Internal server error' });
};

const getAreas = catchAsync(async (req: Request, res: Response) => {
  try {
    const data = await publicSiteService.getAreaCoverage(String(req.query.postcode ?? ''));
    return res.send({ success: true, data });
  } catch (error) {
    return handlePublicSiteError(res, error);
  }
});

const getInstructors = catchAsync(async (req: Request, res: Response) => {
  try {
    const data = await publicSiteService.listInstructors({
      postcode: req.query.postcode ? String(req.query.postcode) : undefined,
      transmission: req.query.transmission ? String(req.query.transmission) : undefined,
      female: req.query.female ? String(req.query.female) : undefined,
    });
    return res.send({ success: true, data });
  } catch (error) {
    return handlePublicSiteError(res, error);
  }
});

const applyInstructor = catchAsync(async (req: Request, res: Response) => {
  try {
    const data = await publicSiteService.createInstructorApplication(req.body);
    return res.send({ success: true, data });
  } catch (error) {
    return handlePublicSiteError(res, error);
  }
});

const submitContact = catchAsync(async (req: Request, res: Response) => {
  try {
    const ip = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ?? 'unknown';
    const data = await publicSiteService.createContactSubmission(req.body, ip);
    return res.send({ success: true, data });
  } catch (error) {
    return handlePublicSiteError(res, error);
  }
});

const register = catchAsync(async (req: Request, res: Response) => {
  try {
    const data = await publicSiteService.registerUser(req.body);
    return res.send({ success: true, data });
  } catch (error) {
    return handlePublicSiteError(res, error);
  }
});

const getTheoryQuestions = catchAsync(async (req: Request, res: Response) => {
  try {
    const appUserId = req.appUserId;
    if (!appUserId) {
      return res.status(401).send({ success: false, error: 'Unauthorised' });
    }

    const data = await publicSiteService.getTheoryQuestions(appUserId, {
      page: req.query.page ? String(req.query.page) : undefined,
      limit: req.query.limit ? String(req.query.limit) : undefined,
      category: req.query.category ? String(req.query.category) : undefined,
    });
    return res.send({ success: true, data });
  } catch (error) {
    return handlePublicSiteError(res, error);
  }
});

export default {
  getAreas,
  getInstructors,
  applyInstructor,
  submitContact,
  register,
  getTheoryQuestions,
};
