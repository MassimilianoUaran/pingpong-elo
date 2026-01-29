import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const form = await request.formData();
  const seasonId = String(form.get("season_id") ?? "");
  const returnTo = String(form.get("return_to") ?? "/");

  const res = NextResponse.redirect(new URL(returnTo, request.url), { status: 303 });

  res.cookies.set("pp_season", seasonId, {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return res;
}
