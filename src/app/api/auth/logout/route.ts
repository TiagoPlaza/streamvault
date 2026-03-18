import { deleteSession } from '@/lib/auth';
import { ok, serverError } from '@/app/api/_helpers';

export async function POST() {
  try {
    await deleteSession();
    return ok({});
  } catch (e) {
    return serverError(e);
  }
}