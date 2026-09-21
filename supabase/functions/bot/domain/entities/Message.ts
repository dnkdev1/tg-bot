// @ts-nocheck
export class Message {
  constructor({ from, text, date, userId, firstName = null, lastName = null }) {
    this.from = from;
    this.text = text;
    this.date = date;
    this.userId = userId;
    this.firstName = firstName;
    this.lastName = lastName;
  }
}
