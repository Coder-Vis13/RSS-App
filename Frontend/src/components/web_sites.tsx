import React from "react";

interface Site {
  logo: string;
  name: string;
}

const sites: Site[] = [
  { logo: "/f_logo.png", name: "Forbes" },
  { logo: "/bbc_logo.png", name: "BBC" },
  { logo: "/espn_logo.png", name: "ESPN" },
  { logo: "/ndtv_logo.png", name: "NDTV" },
  { logo: "/ht_logo.png", name: "The Hindustan Times" },
  { logo: "/ng_logo.png", name: "National Geographic" },
  { logo: "/hb_logo.png", name: "Harper's Bazaar" },
  { logo: "/v_logo.png", name: "Vogue" },
  { logo: "/toi_logo.png", name: "Times of India" },
  { logo: "/it_logo.png", name: "India Today" },
  { logo: "/cnn_logo.png", name: "CNN" },
  { logo: "/tnyt_logo.png", name: "NY Times" },
  { logo: "/bi_logo.png", name: "Business Insider" },
  { logo: "/th_logo.png", name: "The Hindu" },
  { logo: "/bf_logo.png", name: "BuzzFeed" },
  { logo: "/ew_logo.png", name: "Economic Weekly" },
];


export const Sites: React.FC = () => {
  return (
    <section className="py-8 px-8 bg-gray-50 mt-6 ml-0">
      <div className="max-w-7xl mx-auto px-6 text-left">
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-12 whitespace-nowrap items-center">
          {sites.map((site, index) => (
            <div key={index} className="flex flex-col items-center hover:scale-110 transition-transform duration-200">
              <img
                src={site.logo}
                alt={site.name}
                className="h-10 w-auto object-contain mb-2"
              />
              <p className="text-sm text-grey-700 justify-center">{site.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};


export default Sites;
