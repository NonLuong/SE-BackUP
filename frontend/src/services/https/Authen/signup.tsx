import { Passenger } from "../../../interfaces/IPassenger";
import axios from "axios";

const apiUrl = "http://localhost:8080";

async function CreateUser(data: Passenger) {
    return await axios
      .post(`${apiUrl}/signup`, data)
      .then((res) => res)
      .catch((e) => e.response);
  }

export { CreateUser };