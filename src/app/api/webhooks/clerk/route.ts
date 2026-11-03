// This route handles incoming webhooks events from clerk.
// It listens for user related events - user.created, user.updated, user.deleted.

import { createUser, deleteUser, updateuser } from "@/actions/userActions";
import { ApiError } from "@/lib/apiError";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;

    if (!secret) {
      throw new ApiError("Please add webhook secret in env", 400);
    }

    const evt = await verifyWebhook(req, {
      signingSecret: secret,
    });

    const { id } = evt.data;
    const eventType = evt.type;

    if (!id) {
      throw new ApiError("Error occured - No id in event", 400);
    }

    if (eventType === "user.created" || eventType === "user.updated") {
      const user = {
        clerkId: id,
        email: evt.data.email_addresses[0].email_address,
      };

      if (eventType === "user.created") {
        try {
          const newUser = await createUser(user);

          return NextResponse.json(
            { message: "User created successfully", newUser },
            { status: 201 },
          );
        } catch (error) {
          console.error("Error creating user:", error);
          throw new ApiError("Error creating user", 500);
        }
      } else if (eventType === "user.updated") {
        try {
          const updatedUser = await updateuser(id, user);
          return NextResponse.json(
            { message: "User updated successfully", updatedUser },
            { status: 200 },
          );
        } catch (error) {
          console.error("Error updating user:", error);
          throw new ApiError("Error updating user", 500);
        }
      }
    }

    if (eventType === "user.deleted") {
      try {
        const deletedUser = await deleteUser(id);

        return NextResponse.json(
          { message: "User deleted successfully", deletedUser },
          { status: 200 },
        );
      } catch (error) {
        console.error("Error deleting user:", error);
        throw new ApiError("Error deleting user", 500);
      }
    }

    return NextResponse.json(
      { message: "Webhook processed successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    if (error instanceof ApiError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.statusCode },
      );
    }
  }
}
