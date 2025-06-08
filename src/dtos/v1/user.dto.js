class UserDto {
  constructor(user) {
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.role = user.role;
    this.created_at = user.created_at;
  }
}

module.exports = UserDto; 