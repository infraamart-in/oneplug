export interface SectionContent {
  id: string;
  heading: string;
  body: string | string[];
  position: 'left' | 'right' | 'center';
}
