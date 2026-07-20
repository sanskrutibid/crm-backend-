export class CreateHolidayDto {
  name?: string;
  holidayName?: string; // alias for name
  date?: string;
  holidayDate?: string; // alias for date
  day?: string;
  type?: string;
  holidayType?: string; // alias for type
  applicableFor?: string;
  description?: string;
  status?: string;
  notifyEmployees?: boolean;
}
