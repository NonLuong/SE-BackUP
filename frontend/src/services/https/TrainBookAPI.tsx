import { TrainbookInterface } from "../../interfaces/ITrainbook";

const apiUrl = "http://localhost:8080";

// GET all trainbooks
export async function GetTrainbooks() {
  const requestOptions = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const res = await fetch(`${apiUrl}/trainbook`, requestOptions)
    .then((res) => {
      if (res.ok) return res.json();
      throw new Error(`Error fetching trainbooks: ${res.status}`);
    })
    .catch((error) => {
      console.error("Error fetching trainbooks:", error);
      return false;
    });

  return res;
}

// GET trainbook by ID
export async function GetTrainbookById(id: number) {
  const requestOptions = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const res = await fetch(`${apiUrl}/trainbook/${id}`, requestOptions)
    .then((res) => {
      if (res.ok) return res.json();
      throw new Error(`Error fetching trainbook by ID (${id}): ${res.status}`);
    })
    .catch((error) => {
      console.error("Error fetching trainbook by ID:", error);
      return false;
    });

  return res;
}

// POST (Create) a new trainbook
export async function CreateTrainbook(data: TrainbookInterface) {
  if (!data.RoomID || !data.DriverID || !data.Status) {
    console.error("Missing required fields for creating a trainbook:", data);
    return false;
  }

  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  };

  const res = await fetch(`${apiUrl}/trainbook`, requestOptions)
    .then((res) => {
      if (res.status === 201) return res.json();
      throw new Error(`Error creating trainbook: ${res.status}`);
    })
    .catch((error) => {
      console.error("Error creating trainbook:", error);
      return false;
    });

  return res;
}

// PATCH (Update) an existing trainbook
export async function UpdateTrainbookById(data: TrainbookInterface) {
  if (!data.ID) {
    console.error("Missing ID for updating trainbook:", data);
    return false;
  }

  const requestOptions = {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  };

  const res = await fetch(`${apiUrl}/trainbook/${data.ID}`, requestOptions)
    .then((res) => {
      if (res.status === 200) return res.json();
      throw new Error(`Error updating trainbook with ID (${data.ID}): ${res.status}`);
    })
    .catch((error) => {
      console.error("Error updating trainbook:", error);
      return false;
    });

  return res;
}

// DELETE a trainbook by ID
export async function DeleteTrainbookById(id: number) {
  const requestOptions = {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const res = await fetch(`${apiUrl}/trainbook/${id}`, requestOptions)
    .then((res) => {
      if (res.status === 200) return true;
      throw new Error(`Error deleting trainbook with ID (${id}): ${res.status}`);
    })
    .catch((error) => {
      console.error("Error deleting trainbook:", error);
      return false;
    });

  return res;
}