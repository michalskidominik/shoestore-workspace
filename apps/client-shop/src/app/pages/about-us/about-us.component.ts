import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'app-about-us',
  standalone: true,
  imports: [CommonModule, RouterLink, CardModule, ButtonModule, DividerModule],
  templateUrl: './about-us.component.html',
  styleUrl: './about-us.component.scss'
})
export class AboutUsComponent {
  readonly companyInfo = {
    name: 'SGATS SHOES SHOP',
    founded: '2020',
    mission: 'To provide high-quality, comfortable, and stylish footwear for every lifestyle.',
    vision: 'To become the leading online destination for premium shoes worldwide.',
    values: [
      'Quality craftsmanship',
      'Customer satisfaction',
      'Sustainable practices',
      'Innovation in design'
    ]
  };

  readonly teamMembers = [
    {
      name: 'Sarah Johnson',
      role: 'Founder & CEO',
      description: 'With over 15 years in the footwear industry, Sarah brings passion and expertise to every aspect of our business.'
    },
    {
      name: 'Mike Chen',
      role: 'Head of Design',
      description: 'Mike\'s creative vision and attention to detail ensure every shoe meets our high standards for style and comfort.'
    },
    {
      name: 'Lisa Rodriguez',
      role: 'Customer Experience Manager',
      description: 'Lisa is dedicated to ensuring every customer has an exceptional experience with our products and services.'
    }
  ];

  readonly stats = [
    { label: 'Happy Customers', value: '50,000+' },
    { label: 'Shoes Sold', value: '200,000+' },
    { label: 'Countries Served', value: '25+' },
    { label: 'Years of Excellence', value: '5+' }
  ];
}
