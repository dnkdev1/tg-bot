// @ts-nocheck
const STUDENT_ID = 4989;

Deno.serve(async (_req) => {
  return Response.json({
    message: "hello, it-incubator",
    studentId: STUDENT_ID,
  });
});
