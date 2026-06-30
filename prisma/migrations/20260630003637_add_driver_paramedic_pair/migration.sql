-- AlterTable
ALTER TABLE "User" ADD COLUMN     "pairedParamedicId" UUID;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_pairedParamedicId_fkey" FOREIGN KEY ("pairedParamedicId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
