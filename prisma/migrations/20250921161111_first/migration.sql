-- CreateTable
CREATE TABLE "public"."Entry" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "place" TEXT NOT NULL,
    "poojaType" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,

    CONSTRAINT "Entry_pkey" PRIMARY KEY ("id")
);
