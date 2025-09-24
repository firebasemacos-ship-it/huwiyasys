export type App = {
  id: string;
  name: string;
  iconImageId: string;
  category: string;
  description: string;
  permissions: string[];
  usage: {
    time: number; // in minutes
    data: number; // in MB
  };
};

export const appsData: App[] = [
  {
    id: "1",
    name: "ConnectSphere",
    iconImageId: "app-icon-1",
    category: "Social",
    description: "A social networking app to connect with friends and family.",
    permissions: ["Contacts", "Camera", "Location", "Microphone", "Storage"],
    usage: { time: 125, data: 240 },
  },
  {
    id: "2",
    name: "TaskMaster Pro",
    iconImageId: "app-icon-2",
    category: "Productivity",
    description: "Manage your tasks and projects efficiently.",
    permissions: ["Calendar", "Storage", "Notifications"],
    usage: { time: 80, data: 50 },
  },
  {
    id: "3",
    name: "Galaxy Quest",
    iconImageId: "app-icon-3",
    category: "Gaming",
    description: "An epic space adventure game.",
    permissions: ["Internet", "Storage", "In-app purchases"],
    usage: { time: 210, data: 550 },
  },
  {
    id: "4",
    name: "PocketBank",
    iconImageId: "app-icon-4",
    category: "Finance",
    description: "Your personal finance and banking assistant.",
    permissions: ["Contacts", "SMS", "Location", "Phone"],
    usage: { time: 30, data: 25 },
  },
  {
    id: "5",
    name: "FitTrack+",
    iconImageId: "app-icon-5",
    category: "Health & Fitness",
    description: "Monitor your workouts, steps, and health goals.",
    permissions: ["Location", "Body sensors", "Bluetooth", "Activity recognition"],
    usage: { time: 45, data: 60 },
  },
  {
    id: "6",
    name: "SoundWave",
    iconImageId: "app-icon-6",
    category: "Music & Audio",
    description: "Stream unlimited music and podcasts.",
    permissions: ["Storage", "Microphone", "Internet"],
    usage: { time: 150, data: 320 },
  },
  {
    id: "7",
    name: "WeatherNow",
    iconImageId: "app-icon-7",
    category: "Weather",
    description: "Get real-time weather forecasts and alerts.",
    permissions: ["Location", "Internet"],
    usage: { time: 15, data: 15 },
  },
  {
    id: "8",
    name: "DailyBrief",
    iconImageId: "app-icon-8",
    category: "News & Magazines",
    description: "Your daily source of curated news and articles.",
    permissions: ["Internet", "Notifications"],
    usage: { time: 60, data: 90 },
  },
];
