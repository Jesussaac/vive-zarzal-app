'use strict';

const { QueryTypes } = require('sequelize');

const locationsData = [
  {
    name: 'Colombia',
    iso2: 'CO',
    iso3: 'COL',
    phone_code: '+57',
    departments: [
      {
        name: 'Amazonas',
        code: '91',
        cities: [{ name: 'Leticia', code: '91001' }],
      },
      {
        name: 'Antioquia',
        code: '05',
        cities: [
          { name: 'Medellín', code: '05001' },
          { name: 'Bello', code: '05088' },
          { name: 'Itagüí', code: '05360' },
          { name: 'Envigado', code: '05266' },
          { name: 'Rionegro', code: '05615' },
        ],
      },
      {
        name: 'Arauca',
        code: '81',
        cities: [{ name: 'Arauca', code: '81001' }],
      },
      {
        name: 'Atlántico',
        code: '08',
        cities: [
          { name: 'Barranquilla', code: '08001' },
          { name: 'Soledad', code: '08758' },
        ],
      },
      {
        name: 'Bogotá, D.C.',
        code: '11',
        cities: [{ name: 'Bogotá', code: '11001' }],
      },
      {
        name: 'Bolívar',
        code: '13',
        cities: [
          { name: 'Cartagena', code: '13001' },
          { name: 'Magangué', code: '13430' },
        ],
      },
      {
        name: 'Boyacá',
        code: '15',
        cities: [
          { name: 'Tunja', code: '15001' },
          { name: 'Duitama', code: '15238' },
          { name: 'Sogamoso', code: '15759' },
        ],
      },
      {
        name: 'Caldas',
        code: '17',
        cities: [
          { name: 'Manizales', code: '17001' },
          { name: 'La Dorada', code: '17380' },
        ],
      },
      {
        name: 'Caquetá',
        code: '18',
        cities: [{ name: 'Florencia', code: '18001' }],
      },
      {
        name: 'Casanare',
        code: '85',
        cities: [{ name: 'Yopal', code: '85001' }],
      },
      {
        name: 'Cauca',
        code: '19',
        cities: [
          { name: 'Popayán', code: '19001' },
          { name: 'Santander de Quilichao', code: '19698' },
        ],
      },
      {
        name: 'Cesar',
        code: '20',
        cities: [
          { name: 'Valledupar', code: '20001' },
          { name: 'Aguachica', code: '20011' },
        ],
      },
      {
        name: 'Chocó',
        code: '27',
        cities: [{ name: 'Quibdó', code: '27001' }],
      },
      {
        name: 'Córdoba',
        code: '23',
        cities: [
          { name: 'Montería', code: '23001' },
          { name: 'Lorica', code: '23417' },
        ],
      },
      {
        name: 'Cundinamarca',
        code: '25',
        cities: [
          { name: 'Soacha', code: '25754' },
          { name: 'Chía', code: '25175' },
          { name: 'Zipaquirá', code: '25899' },
          { name: 'Fusagasugá', code: '25290' },
        ],
      },
      {
        name: 'Guainía',
        code: '94',
        cities: [{ name: 'Inírida', code: '94001' }],
      },
      {
        name: 'Guaviare',
        code: '95',
        cities: [{ name: 'San José del Guaviare', code: '95001' }],
      },
      {
        name: 'Huila',
        code: '41',
        cities: [
          { name: 'Neiva', code: '41001' },
          { name: 'Pitalito', code: '41551' },
        ],
      },
      {
        name: 'La Guajira',
        code: '44',
        cities: [
          { name: 'Riohacha', code: '44001' },
          { name: 'Maicao', code: '44430' },
        ],
      },
      {
        name: 'Magdalena',
        code: '47',
        cities: [
          { name: 'Santa Marta', code: '47001' },
          { name: 'Ciénaga', code: '47189' },
        ],
      },
      {
        name: 'Meta',
        code: '50',
        cities: [
          { name: 'Villavicencio', code: '50001' },
          { name: 'Acacías', code: '50006' },
        ],
      },
      {
        name: 'Nariño',
        code: '52',
        cities: [
          { name: 'Pasto', code: '52001' },
          { name: 'Tumaco', code: '52835' },
          { name: 'Ipiales', code: '52356' },
        ],
      },
      {
        name: 'Norte de Santander',
        code: '54',
        cities: [
          { name: 'Cúcuta', code: '54001' },
          { name: 'Ocaña', code: '54498' },
        ],
      },
      {
        name: 'Putumayo',
        code: '86',
        cities: [{ name: 'Mocoa', code: '86001' }],
      },
      {
        name: 'Quindío',
        code: '63',
        cities: [
          { name: 'Armenia', code: '63001' },
          { name: 'Calarcá', code: '63130' },
        ],
      },
      {
        name: 'Risaralda',
        code: '66',
        cities: [
          { name: 'Pereira', code: '66001' },
          { name: 'Dosquebradas', code: '66170' },
        ],
      },
      {
        name: 'San Andrés y Providencia',
        code: '88',
        cities: [
          { name: 'San Andrés', code: '88001' },
          { name: 'Providencia', code: '88564' },
        ],
      },
      {
        name: 'Santander',
        code: '68',
        cities: [
          { name: 'Bucaramanga', code: '68001' },
          { name: 'Floridablanca', code: '68276' },
          { name: 'Barrancabermeja', code: '68081' },
        ],
      },
      {
        name: 'Sucre',
        code: '70',
        cities: [{ name: 'Sincelejo', code: '70001' }],
      },
      {
        name: 'Tolima',
        code: '73',
        cities: [
          { name: 'Ibagué', code: '73001' },
          { name: 'Espinal', code: '73268' },
        ],
      },
      {
        name: 'Valle del Cauca',
        code: '76',
        cities: [
          { name: 'Zarzal', code: '76895' },
          { name: 'Cali', code: '76001' },
          { name: 'Palmira', code: '76520' },
          { name: 'Buenaventura', code: '76109' },
          { name: 'Tuluá', code: '76834' },
          { name: 'Guadalajara de Buga', code: '76111' },
          { name: 'Cartago', code: '76147' },
          { name: 'Jamundí', code: '76364' },
          { name: 'Yumbo', code: '76892' },
          { name: 'Roldanillo', code: '76622' },
          { name: 'Sevilla', code: '76736' },
          { name: 'Caicedonia', code: '76122' },
        ],
      },
      {
        name: 'Vaupés',
        code: '97',
        cities: [{ name: 'Mitú', code: '97001' }],
      },
      {
        name: 'Vichada',
        code: '99',
        cities: [{ name: 'Puerto Carreño', code: '99001' }],
      },
    ],
  },
  {
    name: 'Ecuador',
    iso2: 'EC',
    iso3: 'ECU',
    phone_code: '+593',
    departments: [
      {
        name: 'Pichincha',
        code: 'EC-P',
        cities: [{ name: 'Quito', code: 'UIO' }],
      },
      {
        name: 'Guayas',
        code: 'EC-G',
        cities: [{ name: 'Guayaquil', code: 'GYE' }],
      },
    ],
  },
  {
    name: 'Perú',
    iso2: 'PE',
    iso3: 'PER',
    phone_code: '+51',
    departments: [
      {
        name: 'Lima',
        code: 'PE-LIM',
        cities: [{ name: 'Lima', code: 'LIM' }],
      },
      {
        name: 'Cusco',
        code: 'PE-CUS',
        cities: [{ name: 'Cusco', code: 'CUZ' }],
      },
    ],
  },
  {
    name: 'Venezuela',
    iso2: 'VE',
    iso3: 'VEN',
    phone_code: '+58',
    departments: [
      {
        name: 'Distrito Capital',
        code: 'VE-A',
        cities: [{ name: 'Caracas', code: 'CCS' }],
      },
      {
        name: 'Zulia',
        code: 'VE-V',
        cities: [{ name: 'Maracaibo', code: 'MAR' }],
      },
    ],
  },
  {
    name: 'Panamá',
    iso2: 'PA',
    iso3: 'PAN',
    phone_code: '+507',
    departments: [
      {
        name: 'Panamá',
        code: 'PA-8',
        cities: [{ name: 'Ciudad de Panamá', code: 'PTY' }],
      },
    ],
  },
  {
    name: 'Estados Unidos',
    iso2: 'US',
    iso3: 'USA',
    phone_code: '+1',
    departments: [
      {
        name: 'Florida',
        code: 'FL',
        cities: [
          { name: 'Miami', code: 'MIA' },
          { name: 'Orlando', code: 'ORL' },
        ],
      },
      {
        name: 'Nueva York',
        code: 'NY',
        cities: [{ name: 'Nueva York', code: 'NYC' }],
      },
    ],
  },
  {
    name: 'España',
    iso2: 'ES',
    iso3: 'ESP',
    phone_code: '+34',
    departments: [
      {
        name: 'Comunidad de Madrid',
        code: 'MD',
        cities: [{ name: 'Madrid', code: 'MAD' }],
      },
      {
        name: 'Cataluña',
        code: 'CT',
        cities: [{ name: 'Barcelona', code: 'BCN' }],
      },
    ],
  },
];

const select = (queryInterface, sql, replacements = {}) =>
  queryInterface.sequelize.query(sql, {
    type: QueryTypes.SELECT,
    replacements,
  });

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    for (const countryData of locationsData) {
      let country = await select(
        queryInterface,
        'SELECT id FROM countries WHERE iso2 = :iso2',
        { iso2: countryData.iso2 }
      );

      if (!country.length) {
        await queryInterface.bulkInsert('countries', [
          {
            name: countryData.name,
            iso2: countryData.iso2,
            iso3: countryData.iso3,
            phone_code: countryData.phone_code,
            created_at: now,
            updated_at: now,
          },
        ]);
        country = await select(
          queryInterface,
          'SELECT id FROM countries WHERE iso2 = :iso2',
          { iso2: countryData.iso2 }
        );
      }

      const countryId = country[0].id;

      for (const department of countryData.departments) {
        let row = await select(
          queryInterface,
          `SELECT id FROM departments
           WHERE country_id = :countryId AND name = :name`,
          { countryId, name: department.name }
        );

        if (!row.length) {
          await queryInterface.bulkInsert('departments', [
            {
              country_id: countryId,
              name: department.name,
              code: department.code,
              created_at: now,
              updated_at: now,
            },
          ]);
          row = await select(
            queryInterface,
            `SELECT id FROM departments
             WHERE country_id = :countryId AND name = :name`,
            { countryId, name: department.name }
          );
        }

        const departmentId = row[0].id;

        for (const city of department.cities || []) {
          const existingCity = await select(
            queryInterface,
            `SELECT id FROM cities
             WHERE department_id = :departmentId AND name = :name`,
            { departmentId, name: city.name }
          );

          if (!existingCity.length) {
            await queryInterface.bulkInsert('cities', [
              {
                department_id: departmentId,
                name: city.name,
                code: city.code,
                created_at: now,
                updated_at: now,
              },
            ]);
          }
        }
      }
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('countries', {
      iso2: locationsData.map((country) => country.iso2),
    });
  },
};
