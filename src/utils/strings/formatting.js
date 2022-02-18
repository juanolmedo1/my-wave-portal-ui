import { format } from "date-fns";

export const formatAddress = (address) => {
  const firstPart = address.slice(0, 5);
  const secondPart = address.slice(-4);
  return `${firstPart}...${secondPart}`;
};

export const formatDate = (timestamp) => {
  return `${format(new Date(timestamp), "MM/dd/yyyy HH:mm")} hs.`;
};
