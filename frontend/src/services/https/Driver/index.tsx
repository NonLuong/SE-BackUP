import axios from "axios";
import { IDriver } from "../../../interfaces/IDriver";

const apiUrl = "http://localhost:8080";

function getAuthHeaders() {
  const token = localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// Create Driver
async function createDriver(driver: IDriver) {
  const requestOptions = {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      firstname: driver.firstname,
      lastname: driver.lastname,
      phone_number: driver.phoneNumber, // Ensure this matches the Controller's key
      date_of_birth: driver.dateOfBirth, // Ensure it's in "YYYY-MM-DD" format
      driver_license_number: driver.driverLicenseNumber,
      driver_license_expiration_date: driver.driverLicenseExpirationDate,
      income: driver.income,
      email: driver.email,
      password: driver.password,
      gender_id: driver.genderId, // Ensure it's sent as a number
    }),
  };

  try {
    const response = await fetch(`${apiUrl}/drivers`, requestOptions);
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error creating driver:", error);
    return { status: 500, message: "Server Error" };
  }
}

// List Drivers
async function listDrivers() {
    const requestOptions = {
      method: "GET",
      headers: getAuthHeaders(),
    };
  
    try {
      const response = await fetch(`${apiUrl}/drivers`, requestOptions);
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      const data = await response.json();
      return data.drivers || []; // ดึงเฉพาะฟิลด์ที่เป็นอาเรย์
    } catch (error) {
      console.error("Error listing drivers:", error);
      return [];
    }
  }
  
  

// List Genders
async function listGenders() {
  const requestOptions = {
    method: "GET",
    headers: getAuthHeaders(),
  };

  try {
    const response = await fetch(`${apiUrl}/genders`, requestOptions);
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error listing genders:", error);
    return [];
  }
}

// Delete Driver
async function deleteDriver(id: number) {
  const requestOptions = {
    method: "DELETE",
    headers: getAuthHeaders(),
  };

  try {
    const response = await fetch(`${apiUrl}/driver/${id}`, requestOptions);
    return response.ok;
  } catch (error) {
    console.error("Error deleting driver:", error);
    return false;
  }
}

// Update Driver
export const updateDriver = async (driver: IDriver) => {
  try {
    const response = await axios.put(`${apiUrl}/driver/${driver.id}`, driver, {
      headers: getAuthHeaders(),
    });
    return response;
  } catch (error) {
    console.error("Error updating driver:", error);
    throw error;
  }
};

// Get Driver by ID
export const getDriver = async (id: string | number) => {
  const requestOptions = {
    method: "GET",
    headers: getAuthHeaders(),
  };

  try {
    const response = await fetch(`${apiUrl}/driver/${id}`, requestOptions);
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching driver with ID ${id}:`, error);
    throw error;
  }
};

export {
  createDriver,
  listDrivers,
  listGenders,
  deleteDriver,
};
