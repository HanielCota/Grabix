import { auth } from "@/auth";
import { Errors } from "@/features/media-downloader/domain/errors";
import { isAdmin } from "@/server/admin";

export interface AuthedUser {
  id: string;
  email?: string | null;
  name?: string | null;
}

/** Resolve the signed-in user or throw a 401 AppError (handled by handleApiError). */
export async function requireUser(): Promise<AuthedUser> {
  const session = await auth();
  if (!session?.user?.id) {
    throw Errors.unauthorized();
  }
  return { id: session.user.id, email: session.user.email, name: session.user.name };
}

/** Resolve the signed-in user and require admin rights, else throw 401/403. */
export async function requireAdmin(): Promise<AuthedUser> {
  const user = await requireUser();
  if (!(await isAdmin(user.id, user.email))) {
    throw Errors.forbidden();
  }
  return user;
}
