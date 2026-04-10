-- CreateTable
CREATE TABLE "Vep" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "category" TEXT,
    "oem" TEXT,
    "model" TEXT,
    "engineNumber" TEXT,
    "chassisNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "WorkOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workOrderNumber" TEXT NOT NULL,
    "vepId" TEXT NOT NULL,
    "dateReceived" TEXT NOT NULL,
    "workType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkOrder_vepId_fkey" FOREIGN KEY ("vepId") REFERENCES "Vep" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JobCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobCardNumber" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "openedDate" TEXT NOT NULL,
    "closedDate" TEXT,
    "testDate" TEXT,
    "testType" TEXT,
    "testResult" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JobCard_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Ion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobCardId" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "dateRequested" TEXT NOT NULL,
    "dateReceived" TEXT,
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Ion_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "JobCard" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RequestedSpare" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobCardId" TEXT NOT NULL,
    "ionId" TEXT,
    "spareName" TEXT NOT NULL,
    "partNumber" TEXT,
    "quantityRequested" INTEGER NOT NULL DEFAULT 1,
    "quantityReceived" INTEGER NOT NULL DEFAULT 0,
    "scalingStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "scalingStartDate" TEXT,
    "availability" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RequestedSpare_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "JobCard" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RequestedSpare_ionId_fkey" FOREIGN KEY ("ionId") REFERENCES "Ion" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Nac" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobCardId" TEXT NOT NULL,
    "requestDate" TEXT NOT NULL,
    "receivedDate" TEXT,
    "nacStatus" TEXT NOT NULL DEFAULT 'REQUESTED',
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Nac_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "JobCard" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Procurement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobCardId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "supplyOrderNumber" TEXT,
    "vendorName" TEXT,
    "procurementDate" TEXT,
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Procurement_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "JobCard" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Crv" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobCardId" TEXT NOT NULL,
    "procurementId" TEXT,
    "voucherType" TEXT NOT NULL DEFAULT 'CRV',
    "voucherNumber" TEXT NOT NULL,
    "vendorOrUnitName" TEXT,
    "receiptDate" TEXT NOT NULL,
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Crv_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "JobCard" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Crv_procurementId_fkey" FOREIGN KEY ("procurementId") REFERENCES "Procurement" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CrvItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "crvId" TEXT NOT NULL,
    "requestedSpareId" TEXT,
    "spareName" TEXT NOT NULL,
    "partNumber" TEXT,
    "quantityReceived" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CrvItem_crvId_fkey" FOREIGN KEY ("crvId") REFERENCES "Crv" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CrvItem_requestedSpareId_fkey" FOREIGN KEY ("requestedSpareId") REFERENCES "RequestedSpare" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Civ" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobCardId" TEXT NOT NULL,
    "civNumber" TEXT NOT NULL,
    "issueDate" TEXT NOT NULL,
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Civ_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "JobCard" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Vep_registrationNumber_key" ON "Vep"("registrationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrder_workOrderNumber_key" ON "WorkOrder"("workOrderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "JobCard_jobCardNumber_key" ON "JobCard"("jobCardNumber");
