// Ensure your API calls include profession and expertization fields

export const updateUserProfile = async (userId, userData) => {
  // Make sure userData includes profession field
  try {
    const response = await api.put(`/users/${userId}`, {
      ...userData,
      // Explicitly include profession field to ensure it's sent
      profession: userData.profession || ''
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
