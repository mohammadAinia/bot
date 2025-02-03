import React, { useState } from "react";
import axios from "axios";

const WhatsAppRequestForm = () => {
  const [formData, setFormData] = useState({
    user_name: "John Doe",
    email: "johndoe@example.com",
    phone_number: "+971 501234567",
    city: "Dubai",
    label: "Home",
    address: "123 Street, Downtown",
    street: "Main Street",
    building_name: "Building A",
    flat_no: "101",
    latitude: "25.276987",
    longitude: "55.296249",
    quantity: "5"
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form Data: ", formData);  // Log the form data to check its structure

    // إضافة التحقق من صحة البيانات
    if (!formData.user_name || !formData.email || !formData.phone_number || !formData.city) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      const response = await axios.post(
        "https://api.lootahbiofuels.com/api/v1/whatsapp_request",
        formData,
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
      console.log(response.data);  // Log the response from the server
      alert("Request submitted successfully!");
    } catch (error) {
      console.error("Error submitting the form", error.response ? error.response.data : error);
      alert("There was an error submitting the form.");
    }
  };

  return (
    <div>
      <h2>WhatsApp Request Form</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="user_name"
          placeholder="User Name"
          value={formData.user_name}
          onChange={handleChange}
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
        />
        <input
          type="text"
          name="phone_number"
          placeholder="Phone Number"
          value={formData.phone_number}
          onChange={handleChange}
        />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default WhatsAppRequestForm;
