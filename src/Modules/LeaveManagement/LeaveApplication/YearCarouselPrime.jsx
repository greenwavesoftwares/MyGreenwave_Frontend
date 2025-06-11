import React from "react";
import { Carousel } from "primereact/carousel";
import { Card } from "primereact/card";
import { Divider } from "primereact/divider";

const yearData = [
  {
    year: 2020,
    description: "Global pandemic begins. Remote work becomes the norm.",
  },
  {
    year: 2021,
    description: "Vaccinations rollout and hybrid work gains popularity.",
  },
  {
    year: 2022,
    description: "Web3, NFTs, and the metaverse dominate tech headlines.",
  },
  {
    year: 2023,
    description: "AI tools like ChatGPT gain mainstream adoption.",
  },
  {
    year: 2024,
    description: "Focus on ethical AI and sustainability in tech.",
  },
];

const YearCarouselPrime = () => {
  const yearTemplate = (item) => {
    return (
      <Card title={item.year} className="m-2 shadow-3">
        <p className="p-m-0">{item.description}</p>
      </Card>
    );
  };

  return (
    <div className="p-4">
      <h2 className="text-center">Yearly Highlights</h2>
      <Divider />
      <Carousel
        value={yearData}
        itemTemplate={yearTemplate}
        numVisible={3}
        numScroll={1}
        responsiveOptions={[
          {
            breakpoint: "1024px",
            numVisible: 2,
            numScroll: 1,
          },
          {
            breakpoint: "600px",
            numVisible: 1,
            numScroll: 1,
          },
        ]}
        circular
        showIndicators
      />
    </div>
  );
};

export default YearCarouselPrime;
