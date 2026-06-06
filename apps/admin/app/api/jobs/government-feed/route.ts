/**
 * Admin app route — JobBoardPanel on admin.elevateforhumanity.org calls this path.
 * Re-exports the LMS handler via relative path (@/ alias would recurse into this file).
 */
export {
  GET,
  POST,
  runtime,
  dynamic,
} from '../../../../../../app/api/jobs/government-feed/route';
