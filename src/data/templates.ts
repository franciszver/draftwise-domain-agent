// Asset class planning document templates
// Templates use plain text with clear visual hierarchy for professional document appearance

export interface AssetTemplate {
    id: string;
    name: string;
    description: string;
    content: string;
}

export const assetTemplates: Record<string, AssetTemplate> = {
    Datacenter: {
        id: 'datacenter',
        name: 'Datacenter Planning Template',
        description: 'Comprehensive template for datacenter facility planning and compliance',
        content: `DATACENTER PLANNING DOCUMENT
================================================================================

1. EXECUTIVE SUMMARY
--------------------------------------------------------------------------------
[Provide a high-level overview of the datacenter project, including objectives, scope, and key stakeholders.]




2. SITE SELECTION & LOCATION
--------------------------------------------------------------------------------

2.1 Geographic Considerations
    - Natural disaster risk assessment
    - Climate and cooling considerations
    - Proximity to power infrastructure
    - Network connectivity options

2.2 Local Regulations
    - Zoning requirements
    - Building codes and permits
    - Environmental impact assessments




3. POWER INFRASTRUCTURE
--------------------------------------------------------------------------------

3.1 Utility Power
    - Primary utility provider
    - Power capacity requirements (MW)
    - Redundancy (N+1, 2N, etc.)

3.2 Backup Power
    - Generator specifications
    - UPS systems
    - Fuel storage and supply

3.3 Power Distribution
    - Electrical distribution architecture
    - Power density per rack




4. COOLING & HVAC
--------------------------------------------------------------------------------

4.1 Cooling Strategy
    - Air cooling vs liquid cooling
    - Hot/cold aisle containment
    - Free cooling opportunities

4.2 Environmental Controls
    - Temperature ranges
    - Humidity control
    - Air quality management




5. NETWORK & CONNECTIVITY
--------------------------------------------------------------------------------

5.1 Network Infrastructure
    - Carrier connectivity
    - Meet-me rooms
    - Cross-connect capacity

5.2 Redundancy
    - Diverse fiber paths
    - Multiple carrier options




6. PHYSICAL SECURITY
--------------------------------------------------------------------------------

6.1 Access Control
    - Perimeter security
    - Biometric access systems
    - Visitor management

6.2 Surveillance
    - CCTV coverage
    - Security operations center




7. FIRE SUPPRESSION
--------------------------------------------------------------------------------
    - Detection systems
    - Suppression methods (gas, water mist)
    - Compliance with local fire codes




8. ENVIRONMENTAL COMPLIANCE
--------------------------------------------------------------------------------

8.1 Emissions & Waste
    - Generator emissions compliance
    - E-waste disposal procedures
    - Hazardous materials handling

8.2 Sustainability
    - Energy efficiency targets (PUE)
    - Renewable energy sourcing
    - Water usage optimization




9. REGULATORY COMPLIANCE
--------------------------------------------------------------------------------

9.1 Data Protection
    - Data residency requirements
    - Privacy regulations (GDPR, CCPA, etc.)

9.2 Industry Standards
    - SOC 2 compliance
    - ISO 27001 certification
    - Uptime Institute tier certification




10. OPERATIONAL CONSIDERATIONS
--------------------------------------------------------------------------------

10.1 Staffing
    - On-site personnel requirements
    - Training and certifications

10.2 Maintenance
    - Preventive maintenance schedules
    - Vendor contracts and SLAs




11. FINANCIAL PLANNING
--------------------------------------------------------------------------------
    - Capital expenditure estimates
    - Operating cost projections
    - ROI analysis




12. TIMELINE & MILESTONES
--------------------------------------------------------------------------------
    - Project phases
    - Key milestones
    - Go-live target date




13. RISK ASSESSMENT
--------------------------------------------------------------------------------
    - Identified risks
    - Mitigation strategies
    - Contingency plans




14. APPENDICES
--------------------------------------------------------------------------------
    - Technical specifications
    - Vendor quotes
    - Reference documents
`,
    },

    Manufacturing: {
        id: 'manufacturing',
        name: 'Manufacturing Facility Planning Template',
        description: 'Template for manufacturing facility planning and regulatory compliance',
        content: `MANUFACTURING FACILITY PLANNING DOCUMENT
================================================================================

1. EXECUTIVE SUMMARY
--------------------------------------------------------------------------------
[Provide a high-level overview of the manufacturing facility project, including objectives, scope, and key stakeholders.]




2. SITE SELECTION & LOCATION
--------------------------------------------------------------------------------

2.1 Location Criteria
    - Proximity to suppliers and markets
    - Transportation infrastructure
    - Labor market availability
    - Utility availability

2.2 Zoning & Permits
    - Industrial zoning requirements
    - Building permits
    - Environmental permits




3. FACILITY DESIGN
--------------------------------------------------------------------------------

3.1 Production Layout
    - Manufacturing floor plan
    - Material flow optimization
    - Production line configuration

3.2 Support Areas
    - Warehousing and storage
    - Quality control labs
    - Administrative offices




4. EQUIPMENT & MACHINERY
--------------------------------------------------------------------------------

4.1 Production Equipment
    - Equipment specifications
    - Capacity requirements
    - Automation systems

4.2 Utilities Requirements
    - Power requirements
    - Compressed air systems
    - Process water/steam




5. WORKFORCE & SAFETY
--------------------------------------------------------------------------------

5.1 Staffing Plan
    - Production staff requirements
    - Shift schedules
    - Training programs

5.2 Occupational Safety
    - OSHA compliance requirements
    - PPE requirements
    - Safety training programs

5.3 Ergonomics
    - Workstation design
    - Material handling equipment




6. ENVIRONMENTAL COMPLIANCE
--------------------------------------------------------------------------------

6.1 Air Quality
    - Emissions permits
    - Ventilation systems
    - Air quality monitoring

6.2 Water & Waste
    - Wastewater treatment
    - Solid waste management
    - Hazardous waste disposal

6.3 Noise Control
    - Noise level regulations
    - Sound barriers and controls




7. QUALITY MANAGEMENT
--------------------------------------------------------------------------------

7.1 Quality Systems
    - ISO 9001 compliance
    - Quality control procedures
    - Inspection and testing

7.2 Traceability
    - Lot tracking systems
    - Documentation requirements




8. SUPPLY CHAIN
--------------------------------------------------------------------------------

8.1 Raw Materials
    - Supplier qualifications
    - Inventory management
    - Receiving procedures

8.2 Logistics
    - Shipping and receiving docks
    - Freight management




9. SECURITY
--------------------------------------------------------------------------------
    - Access control systems
    - Surveillance systems
    - Inventory security




10. FINANCIAL PLANNING
--------------------------------------------------------------------------------
    - Capital expenditure
    - Operating costs
    - Production cost analysis




11. TIMELINE & IMPLEMENTATION
--------------------------------------------------------------------------------
    - Construction phases
    - Equipment installation
    - Production ramp-up




12. RISK ASSESSMENT
--------------------------------------------------------------------------------
    - Operational risks
    - Supply chain risks
    - Mitigation strategies




13. APPENDICES
--------------------------------------------------------------------------------
    - Floor plans
    - Equipment specifications
    - Permit applications
`,
    },

    Warehouse: {
        id: 'warehouse',
        name: 'Warehouse/Logistics Planning Template',
        description: 'Template for warehouse and distribution center planning',
        content: `WAREHOUSE & LOGISTICS PLANNING DOCUMENT
================================================================================

1. EXECUTIVE SUMMARY
--------------------------------------------------------------------------------
[Provide a high-level overview of the warehouse/distribution center project.]




2. SITE SELECTION
--------------------------------------------------------------------------------

2.1 Location Analysis
    - Proximity to transportation hubs
    - Customer distribution analysis
    - Labor market availability

2.2 Facility Requirements
    - Square footage needs
    - Clear height requirements
    - Dock door requirements




3. FACILITY LAYOUT
--------------------------------------------------------------------------------

3.1 Storage Areas
    - Racking systems
    - Bulk storage areas
    - Cold storage (if applicable)

3.2 Operations Areas
    - Receiving and shipping docks
    - Staging areas
    - Packing stations

3.3 Support Areas
    - Office space
    - Break rooms
    - Maintenance areas




4. MATERIAL HANDLING
--------------------------------------------------------------------------------

4.1 Equipment
    - Forklifts and pallet jacks
    - Conveyor systems
    - Automated storage/retrieval

4.2 Technology
    - Warehouse management system (WMS)
    - Barcode/RFID systems
    - Pick-to-light systems




5. INVENTORY MANAGEMENT
--------------------------------------------------------------------------------

5.1 Storage Strategy
    - ABC classification
    - Slotting optimization
    - FIFO/LIFO procedures

5.2 Accuracy
    - Cycle counting programs
    - Inventory reconciliation




6. WORKFORCE & SAFETY
--------------------------------------------------------------------------------

6.1 Staffing
    - Warehouse staff requirements
    - Shift schedules
    - Seasonal staffing plans

6.2 Safety Compliance
    - OSHA requirements
    - Forklift safety training
    - Ergonomic considerations




7. SECURITY
--------------------------------------------------------------------------------
    - Access control
    - Surveillance systems
    - Inventory loss prevention




8. TRANSPORTATION
--------------------------------------------------------------------------------

8.1 Inbound Logistics
    - Carrier management
    - Receiving schedules
    - Dock appointments

8.2 Outbound Logistics
    - Carrier selection
    - Route optimization
    - Delivery scheduling




9. ENVIRONMENTAL CONSIDERATIONS
--------------------------------------------------------------------------------
    - Energy efficiency
    - Lighting systems
    - Waste management




10. FINANCIAL PLANNING
--------------------------------------------------------------------------------
    - Lease vs. build analysis
    - Operating cost estimates
    - Throughput projections




11. IMPLEMENTATION TIMELINE
--------------------------------------------------------------------------------
    - Construction/build-out
    - Equipment installation
    - Go-live phases




12. APPENDICES
--------------------------------------------------------------------------------
    - Floor plans
    - Equipment specifications
    - Vendor contracts
`,
    },

    Office: {
        id: 'office',
        name: 'Office Building Planning Template',
        description: 'Template for office facility planning and compliance',
        content: `OFFICE BUILDING PLANNING DOCUMENT
================================================================================

1. EXECUTIVE SUMMARY
--------------------------------------------------------------------------------
[Provide a high-level overview of the office facility project.]




2. SITE SELECTION
--------------------------------------------------------------------------------

2.1 Location Criteria
    - Accessibility and transportation
    - Nearby amenities
    - Market positioning

2.2 Building Requirements
    - Square footage needs
    - Floor plate requirements
    - Parking requirements




3. SPACE PLANNING
--------------------------------------------------------------------------------

3.1 Workspace Design
    - Open plan vs. private offices
    - Collaboration spaces
    - Meeting rooms

3.2 Support Spaces
    - Reception and lobby
    - Break rooms and kitchens
    - Restrooms

3.3 Special Purpose
    - Server/IT rooms
    - Mail and copy rooms
    - Storage




4. BUILDING SYSTEMS
--------------------------------------------------------------------------------

4.1 HVAC
    - Climate control systems
    - Air quality requirements
    - Energy efficiency

4.2 Electrical
    - Power distribution
    - Emergency power
    - Lighting systems

4.3 Technology
    - Network infrastructure
    - Telecommunications
    - AV systems




5. SAFETY & SECURITY
--------------------------------------------------------------------------------

5.1 Life Safety
    - Fire detection and suppression
    - Emergency exits and signage
    - ADA compliance

5.2 Security Systems
    - Access control
    - Visitor management
    - Surveillance




6. ENVIRONMENTAL & SUSTAINABILITY
--------------------------------------------------------------------------------

6.1 Green Building
    - LEED certification goals
    - Energy efficiency measures
    - Sustainable materials

6.2 Indoor Environment
    - Lighting quality
    - Acoustics
    - Biophilic design elements




7. REGULATORY COMPLIANCE
--------------------------------------------------------------------------------

7.1 Building Codes
    - Occupancy requirements
    - Fire codes
    - Accessibility standards

7.2 Health & Safety
    - OSHA requirements
    - Indoor air quality
    - Ergonomic standards




8. AMENITIES & SERVICES
--------------------------------------------------------------------------------
    - Fitness facilities
    - Food services
    - Common areas




9. FINANCIAL PLANNING
--------------------------------------------------------------------------------
    - Lease analysis
    - Build-out costs
    - Operating expenses




10. IMPLEMENTATION TIMELINE
--------------------------------------------------------------------------------
    - Design phases
    - Construction schedule
    - Move-in plan




11. APPENDICES
--------------------------------------------------------------------------------
    - Floor plans
    - Specifications
    - Vendor proposals
`,
    },

    Retail: {
        id: 'retail',
        name: 'Retail/Commercial Planning Template',
        description: 'Template for retail and commercial facility planning',
        content: `RETAIL/COMMERCIAL FACILITY PLANNING DOCUMENT
================================================================================

1. EXECUTIVE SUMMARY
--------------------------------------------------------------------------------
[Provide a high-level overview of the retail/commercial facility project.]




2. SITE SELECTION
--------------------------------------------------------------------------------

2.1 Location Analysis
    - Demographics and market analysis
    - Traffic patterns and visibility
    - Competition assessment

2.2 Site Requirements
    - Square footage needs
    - Parking requirements
    - Signage opportunities




3. STORE DESIGN
--------------------------------------------------------------------------------

3.1 Customer Areas
    - Sales floor layout
    - Product display zones
    - Fitting rooms (if applicable)

3.2 Back of House
    - Stockroom and receiving
    - Employee areas
    - Office space

3.3 Customer Experience
    - Store flow design
    - Checkout areas
    - Customer service desk




4. BUILDING SYSTEMS
--------------------------------------------------------------------------------

4.1 HVAC & Comfort
    - Climate control
    - Air quality
    - Noise control

4.2 Lighting
    - Ambient lighting
    - Product lighting
    - Energy efficiency

4.3 Technology
    - POS systems
    - Security systems
    - Digital signage




5. SAFETY & SECURITY
--------------------------------------------------------------------------------

5.1 Customer Safety
    - Emergency exits
    - ADA compliance
    - Slip and fall prevention

5.2 Loss Prevention
    - Surveillance systems
    - EAS systems
    - Cash handling procedures




6. REGULATORY COMPLIANCE
--------------------------------------------------------------------------------

6.1 Retail Regulations
    - Business licensing
    - Sales tax compliance
    - Consumer protection laws

6.2 Building Codes
    - Occupancy limits
    - Fire safety
    - Accessibility requirements




7. WORKFORCE
--------------------------------------------------------------------------------

7.1 Staffing
    - Staff requirements
    - Scheduling
    - Training programs

7.2 Labor Compliance
    - Wage and hour laws
    - Break requirements
    - Minor labor laws




8. OPERATIONS
--------------------------------------------------------------------------------

8.1 Inventory
    - Receiving procedures
    - Stock management
    - Replenishment

8.2 Customer Service
    - Service standards
    - Returns and exchanges
    - Customer feedback




9. FINANCIAL PLANNING
--------------------------------------------------------------------------------
    - Build-out costs
    - Operating expenses
    - Sales projections




10. IMPLEMENTATION TIMELINE
--------------------------------------------------------------------------------
    - Design and permitting
    - Construction
    - Store opening




11. APPENDICES
--------------------------------------------------------------------------------
    - Store layouts
    - Fixture specifications
    - Vendor contracts
`,
    },

    Energy: {
        id: 'energy',
        name: 'Energy/Power Plant Planning Template',
        description: 'Template for energy and power generation facility planning',
        content: `ENERGY/POWER PLANT PLANNING DOCUMENT
================================================================================

1. EXECUTIVE SUMMARY
--------------------------------------------------------------------------------
[Provide a high-level overview of the energy/power plant project.]




2. PROJECT OVERVIEW
--------------------------------------------------------------------------------

2.1 Generation Type
    - Fuel source (natural gas, solar, wind, etc.)
    - Generation capacity (MW)
    - Technology selection

2.2 Project Objectives
    - Power purchase agreements
    - Grid interconnection
    - Operational targets




3. SITE SELECTION
--------------------------------------------------------------------------------

3.1 Location Criteria
    - Resource availability (fuel, sun, wind)
    - Grid interconnection proximity
    - Land requirements

3.2 Environmental Factors
    - Environmental impact assessment
    - Sensitive habitats
    - Community considerations




4. TECHNICAL DESIGN
--------------------------------------------------------------------------------

4.1 Generation Equipment
    - Turbines/panels/equipment specifications
    - Efficiency ratings
    - Redundancy design

4.2 Balance of Plant
    - Transformers and switchgear
    - Control systems
    - Auxiliary systems

4.3 Grid Interconnection
    - Transmission requirements
    - Substation design
    - Grid compliance




5. ENVIRONMENTAL COMPLIANCE
--------------------------------------------------------------------------------

5.1 Permits & Approvals
    - Air quality permits
    - Water discharge permits
    - Land use approvals

5.2 Emissions Control
    - Emissions limits
    - Monitoring requirements
    - Control technologies

5.3 Environmental Management
    - Spill prevention
    - Waste management
    - Wildlife protection




6. SAFETY & HEALTH
--------------------------------------------------------------------------------

6.1 Process Safety
    - Hazard analysis
    - Safety systems
    - Emergency response

6.2 Occupational Safety
    - OSHA compliance
    - Training requirements
    - PPE requirements




7. REGULATORY FRAMEWORK
--------------------------------------------------------------------------------

7.1 Energy Regulations
    - FERC/NERC compliance
    - State utility regulations
    - Market participation rules

7.2 Reliability Standards
    - Grid reliability requirements
    - Capacity obligations
    - Ancillary services




8. OPERATIONS & MAINTENANCE
--------------------------------------------------------------------------------

8.1 Staffing
    - Operations personnel
    - Maintenance staff
    - Training and certifications

8.2 Maintenance Strategy
    - Preventive maintenance
    - Predictive maintenance
    - Outage planning




9. FINANCIAL PLANNING
--------------------------------------------------------------------------------

9.1 Capital Costs
    - Equipment costs
    - Construction costs
    - Interconnection costs

9.2 Operating Economics
    - Fuel costs
    - O&M expenses
    - Revenue projections




10. IMPLEMENTATION TIMELINE
--------------------------------------------------------------------------------
    - Development phase
    - Construction schedule
    - Commercial operation date




11. RISK ASSESSMENT
--------------------------------------------------------------------------------
    - Technical risks
    - Regulatory risks
    - Market risks
    - Mitigation strategies




12. APPENDICES
--------------------------------------------------------------------------------
    - Technical specifications
    - Permit applications
    - Financial models
`,
    },
};

export function getTemplateForAsset(assetClass: string): AssetTemplate | null {
    return assetTemplates[assetClass] || null;
}

export function getAvailableAssetClasses(): string[] {
    return Object.keys(assetTemplates);
}
