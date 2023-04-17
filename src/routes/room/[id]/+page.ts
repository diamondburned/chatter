import type { PageLoad } from "./$types.js";

export const load: PageLoad = ({ params }) => {
  return {
    roomID: params.id,
  };
};
