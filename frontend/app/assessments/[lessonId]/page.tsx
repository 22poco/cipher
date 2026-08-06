import { redirect } from "next/navigation";

export default async function AssessmentDetailPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;

  redirect(`/lessons/${lessonId}`);
}
