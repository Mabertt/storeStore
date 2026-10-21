export async function authenticateUser(login, password) {
  const response = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login, password }),
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Unable to authenticate user: ${response.status}`);
  }

  const user = await response.json();

  if (!user || typeof user.login !== "string") {
    throw new Error("The login API returned invalid user data.");
  }

  return user;
}
