export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}

export class InsufficientCashError extends DomainError {
  constructor() {
    super("Not enough cash for this trade.");
    this.name = "InsufficientCashError";
  }
}

export class InsufficientCoinsError extends DomainError {
  constructor() {
    super("Not enough JayCoin to sell.");
    this.name = "InsufficientCoinsError";
  }
}

export class InvalidAmountError extends DomainError {
  constructor() {
    super("Amount must be greater than zero.");
    this.name = "InvalidAmountError";
  }
}

export class InvalidOrderError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = "InvalidOrderError";
  }
}
