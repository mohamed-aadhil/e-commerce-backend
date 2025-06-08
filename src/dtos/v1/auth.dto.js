class AuthResponseDto {
  constructor(user, accessToken, refreshToken) {
    this.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
    };
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }
}

module.exports = AuthResponseDto; 