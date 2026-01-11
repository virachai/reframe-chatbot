# Reframe.AI Implementation Plan

## 🚀 Overview
Reframe.AI is a professional photography bot that uses AI to reframe portrait images according to the **Rule of Thirds**. It integrates LINE Messaging API with Cloudinary's AI-powered smart cropping.

## 🛠 Tech Stack
- **Backend**: NestJS (TypeScript)
- **Chatbot**: LINE Messaging API SDK
- **Image AI**: Cloudinary (Smart Crop & Subject Detection)
- **Frontend**: Tailwind CSS (Premium Dark Aesthetic)

## 📁 Project Structure
- `src/chatbot`: Handles LINE webhooks and message processing.
- `src/image-processor`: Manages Cloudinary uploads and Rule of Thirds transformations.
- `public/index.html`: Premium landing page showcasing the technology.
- `.env`: Configuration for API keys and environment variables.

## ⚙️ Setup Instructions
1. **Environment Variables**: Update the `.env` file with your credentials from [LINE Developers Console](https://developers.line.biz/) and [Cloudinary Dashboard](https://cloudinary.com/).
2. **LINE Webhook**: 
   - Start the server: `npm run start:dev`
   - Expose local port 3000 (e.g., using `ngrok http 3000`).
   - Set the LINE Webhook URL to: `https://your-domain.ngrok-free.app/chatbot/webhook`.
3. **Cloudinary**: Ensure your Cloudinary account has AI Content-Aware cropping enabled (default on free tier).

## 📸 How it Works
1. User sends an image to the LINE Bot.
2. Bot downloads the image and uploads it to Cloudinary.
3. `ImageProcessorService` generates 5 professional compositions:
   - **4 Power Points**: Focal points at intersections.
   - **2 Vertical Thirds**: Subject placement with negative space.
   - **Atmospheric**: Wide-angle storytelling crop.
4. User receives a LINE Carousel with the new versions.

## 🎨 Design Philosophy
The system mimics a **National Geographic photographer**:
- Focuses on **Negative Space**.
- Prioritizes **Environmental Context**.
- Uses **Smart Face/Subject Detection** to ensure eyes or bodies land on "Power Points".
# reframe-chatbot
