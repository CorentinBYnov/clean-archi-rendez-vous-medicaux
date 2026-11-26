// Errors ----------------------------------------------------------------------

export abstract class DomainError extends Error {
  abstract readonly code: string;
}

export class InvalidTimeSlotError extends DomainError {
  readonly code = "invalid-time-slot";
  constructor(public readonly start: Date, public readonly end: Date) {
    super(`Invalid time slot: start (${start}) is not before end (${end})`);
  }
}

export class SlotAlreadyBookedError extends DomainError {
  readonly code = "slot-already-booked";
  constructor() {
    super("This time slot is already booked");
  }
}

export class AppointmentNotFoundError extends DomainError {
  readonly code = "appointment-not-found";
  constructor(public readonly appointmentId: string) {
    super(`Appointment not found: ${appointmentId}`);
  }
}

// Domain ----------------------------------------------------------------------

export type AppointmentStatus = "Booked" | "Cancelled";

export interface Appointment {
  readonly id: string;
  readonly timeSlot: TimeSlot;
  readonly patientId: string;
  readonly doctorId: string;
  status: AppointmentStatus;
}

export class TimeSlot {
  constructor(readonly start: Date, readonly end: Date) {
    if (start >= end) {
      throw new InvalidTimeSlotError(start, end);
    }
    Object.freeze(this);
  }
}

// Agregates -------------------------------------------------------------------

export class DoctorSchedule {
  appointments: Appointment[] = [];

  constructor(readonly doctorId: string, appointments: Appointment[] = []) {
    this.appointments = [...appointments];
  }

  bookAppointment(
    appointmentId: string,
    patientId: string,
    timeSlot: TimeSlot
  ): DomainEvent {
    const appointment: Appointment = {
      id: appointmentId,
      doctorId: this.doctorId,
      patientId,
      timeSlot,
      status: "Booked",
    };
    this.appointments.push(appointment);
    return new AppointmentBooked(
      appointmentId,
      this.doctorId,
      patientId,
      timeSlot
    );
  }

  cancelAppointment(appointmentId: string): DomainEvent {
    const appointment = this.appointments.find((a) => a.id === appointmentId);
    if (!appointment) throw new AppointmentNotFoundError(appointmentId);
    appointment.status = "Cancelled";
    return new AppointmentCancelled(
      appointmentId,
      this.doctorId,
      appointment.patientId
    );
  }
}

// Events ----------------------------------------------------------------------

export type DomainEvent = AppointmentBooked | AppointmentCancelled;

export class AppointmentBooked {
  constructor(
    readonly appointmentId: string,
    readonly doctorId: string,
    readonly patientId: string,
    readonly timeSlot: TimeSlot
  ) {}
}

export class AppointmentCancelled {
  constructor(
    readonly appointmentId: string,
    readonly doctorId: string,
    readonly patientId: string
  ) {}
}
