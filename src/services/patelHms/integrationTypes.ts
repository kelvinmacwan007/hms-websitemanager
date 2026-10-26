export type HmsConnection = {
  baseUrl: string;
  userIdentity: string;
  password: string;
  customerCode: string;
  propertyId: string;
  currency: string;
  propertyPackageId?: string;
};

export type HmsPropertyProfile = {
  propertyId: string;
  propertyName: string;
  propertyAddress?: string;
  propertyLogoPath?: string;
  ianaPropertyTimezone?: string;
};

export type HmsCatalogRoom = {
  id: string;
  propertyId: string;
  typeName: string;
  displayName: string;
  description?: string | null;
  dimension?: string | null;
  maxOccupancy: number;
  totalBedType?: string;
  roomTypeStatus: number;
  roomTypeImages?: Array<{ id: string; imageNamePath: string }>;
  roomTypeAmenities?: Array<{
    amenityMasterId: string;
    amenityName: string;
    amenityIcon?: string | null;
    amenityIconPath?: string | null;
  }>;
};

export type HmsEnvelope<T> = { response: number; message: string; data: T };
export type HmsAddOn = {
  id: string;
  propertyId: string;
  name: string;
  description?: string | null;
  rateAmount: number;
  isActive: number;
  isTaxFree: number;
  applicableStartDate?: string | null;
  applicableEndDate?: string | null;
};
export type HmsOption = { text: string; value: string };
export type HmsLocation = { countryId: number; stateId: number; cityId: number };
export type HmsGuestType = 1 | 2 | 3;
export type HmsGender = 0 | 1 | 2 | 3;
export type HmsGuestMatch = {
  id: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  guestType: HmsGuestType;
};

export type HmsRoomType = {
  id: string;
  typeName: string;
  displayName: string;
  totalRooms: number;
  reservedRooms: number;
  availableRooms: number;
  baseRate: number;
  minRate: number;
  averageRate: number;
  occupancyPercentage: number;
  weekendRate: number;
  roomRateByRateType: number;
  extraPersonRate: number;
  extraChildRate: number;
  baseAdult: number;
  baseChildren: number;
  maxOccupancy: number;
  propertyPackageId: string;
  totalBedType: string;
  smokingPolicy: number;
  petPolicy: number;
  isWheelChair: number;
  isNonCrsInventory: number;
  roomTypeImagesPath: string[];
};

export type HmsForecastDay = {
  roomTypeMasterId: string;
  rateDate: string;
  rate: number;
  dayName: string;
};

export type HmsReservationGuest = {
  firstName: string;
  lastName: string;
  gender: HmsGender;
  mobile: string;
  email: string;
  dateOfBirth?: string;
  countryId: number;
  stateId: number;
  cityId: number;
  zipCode: string;
  age?: number;
  drivingLicenseNumber?: string;
  guestType: HmsGuestType;
  isPrimaryGuest: boolean;
  isChild: boolean;
};

export type HmsReservationRoom = {
  totalAdult: number;
  totalChild: number;
  isPetAllowed: boolean;
  roomTypeMasterId: string;
  guests: HmsReservationGuest[];
  specialRequest?: string;
  requestedPets?: number;
};

export type HmsReservationRequest = {
  propertyId: string;
  checkInDateTime: string;
  checkOutDateTime: string;
  rooms: HmsReservationRoom[];
  reservationNotes?: string;
};

// The outline assigns response code 2 to both creation success and failure.
export type HmsReservationCreateResponse = { response: number; message: string; data?: string };

export type HmsReservationDetails = {
  identityKey: string;
  propertyId: string;
  propertyName: string;
  checkInDateTime: string;
  checkOutDateTime: string;
  reservationStatus: number;
  totalRooms: number;
  totalAdult: number;
  totalChild: number;
  totalPayable: number;
  totalTaxes: number;
  balanceAmount: number;
  reservationRoomTxns: Array<{
    id: string;
    roomTypeMasterId: string;
    roomTypeDisplayName: string;
    totalAdult: number;
    totalChild: number;
    reservationGuestInfos: Array<{
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      mobile: string;
    }>;
  }>;
};

export type HmsPaymentDetails = {
  propertyId: string;
  reservationId: string;
  totalRoomAmount: number;
  totalAddonsAmount: number;
  totalDiscount: number;
  totalPayable: number;
  totalTaxes: number;
  totalNight: number;
  totalRooms: number;
  roomTypes: Array<{
    roomTypeMasterId: string;
    displayName: string;
    totalRoom: number;
    roomRates: Array<{
      applicableDate: string;
      roomAmount: number;
      totalTaxes: number;
      netRoomAmount: number;
    }>;
  }>;
};

export type HmsCardPaymentRequest = {
  reservationId: string;
  amount: number;
  cardHolderName: string;
  cardNumber: string;
  expiryDate: string;
  securityCode: string;
  cardType: string;
  addCardToFile: boolean;
};

export type HmsCardPaymentResponse = { success: boolean; message: string };
