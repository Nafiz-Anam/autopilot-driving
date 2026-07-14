import path from 'path';
import fs from 'fs';
import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import blogService from '../services/blog.service';

/* ── Public ── */

const listBlogs = catchAsync(async (req: Request, res: Response) => {
  const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
  const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 10;
  const tag = req.query.tag ? String(req.query.tag) : undefined;
  const data = await blogService.listPublished(page, limit, tag);
  return res.send({ success: true, ...data });
});

const getBlogBySlug = catchAsync(async (req: Request, res: Response) => {
  const blog = await blogService.getPublishedBySlug(String(req.params.slug));
  if (!blog) return res.status(404).send({ success: false, error: 'Blog not found' });
  return res.send({ success: true, data: blog });
});

/* ── Admin ── */

const adminListBlogs = catchAsync(async (req: Request, res: Response) => {
  const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
  const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
  const published =
    req.query.published === 'true' ? true : req.query.published === 'false' ? false : undefined;
  const data = await blogService.adminListAll(page, limit, published);
  return res.send({ success: true, ...data });
});

const adminGetBlog = catchAsync(async (req: Request, res: Response) => {
  const blog = await blogService.adminGetById(String(req.params.id));
  if (!blog) return res.status(404).send({ success: false, error: 'Blog not found' });
  return res.send({ success: true, data: blog });
});

const adminCreateBlog = catchAsync(async (req: Request, res: Response) => {
  const {
    title,
    slug,
    contentHtml,
    contentJson,
    excerpt,
    coverImage,
    authorName,
    published,
    tags,
    seoTitle,
    seoDescription,
  } = req.body;

  if (!title || !contentHtml) {
    return res.status(400).send({ success: false, error: 'title and contentHtml are required' });
  }

  const blog = await blogService.adminCreate({
    title,
    slug,
    contentHtml,
    contentJson,
    excerpt,
    coverImage,
    authorName,
    published,
    tags,
    seoTitle,
    seoDescription,
  });
  return res.status(201).send({ success: true, data: blog });
});

const adminUpdateBlog = catchAsync(async (req: Request, res: Response) => {
  const {
    title,
    slug,
    contentHtml,
    contentJson,
    excerpt,
    coverImage,
    authorName,
    published,
    tags,
    seoTitle,
    seoDescription,
  } = req.body;

  const blog = await blogService.adminUpdate(String(req.params.id), {
    title,
    slug,
    contentHtml,
    contentJson,
    excerpt,
    coverImage,
    authorName,
    published,
    tags,
    seoTitle,
    seoDescription,
  });
  if (!blog) return res.status(404).send({ success: false, error: 'Blog not found' });
  return res.send({ success: true, data: blog });
});

const adminDeleteBlog = catchAsync(async (req: Request, res: Response) => {
  const blog = await blogService.adminDelete(String(req.params.id));
  if (!blog) return res.status(404).send({ success: false, error: 'Blog not found' });
  return res.send({ success: true });
});

const adminTogglePublish = catchAsync(async (req: Request, res: Response) => {
  const blog = await blogService.adminTogglePublish(String(req.params.id));
  if (!blog) return res.status(404).send({ success: false, error: 'Blog not found' });
  return res.send({ success: true, data: blog });
});

const adminUploadImage = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).send({ success: false, error: 'No file uploaded' });
  }

  const file = req.file as Express.Multer.File;
  const filename = file.filename;
  const url = `/uploads/blog/${filename}`;

  return res.send({ success: true, data: { url } });
});

const adminUploadCoverImage = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).send({ success: false, error: 'No file uploaded' });
  }

  const file = req.file as Express.Multer.File;
  const filename = file.filename;
  const url = `/uploads/blog-covers/${filename}`;

  return res.send({ success: true, data: { url } });
});

export default {
  listBlogs,
  getBlogBySlug,
  adminListBlogs,
  adminGetBlog,
  adminCreateBlog,
  adminUpdateBlog,
  adminDeleteBlog,
  adminTogglePublish,
  adminUploadImage,
  adminUploadCoverImage,
};
