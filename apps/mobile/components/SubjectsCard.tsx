import * as React from "react";

import Card, { CardProps } from "./Card";
import Dropdown, { DropdownProps } from "./Dropdown";

export type SubjectsCardProps = Omit<CardProps, "children"> & {
  dropdownProps: DropdownProps;
};

const SubjectsCard: React.FC<SubjectsCardProps> = ({
  title,
  heightMode,
  height,
  style,
  dropdownProps,
}) => {
  return (
    <Card title={title} heightMode={heightMode} height={height} style={style}>
      <Dropdown {...dropdownProps} />
    </Card>
  );
};

export default React.memo(SubjectsCard);
