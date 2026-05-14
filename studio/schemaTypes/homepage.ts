import { defineType, defineField, defineArrayMember } from 'sanity';

export const homepage = defineType({
  name: 'homepage',
  title: 'Homepage',
  type: 'document',
  fields: [
    defineField({ name: 'homeTitle',    title: 'Home — Titolo',       type: 'string' }),
    defineField({ name: 'homeSubtitle', title: 'Home — Sottotitolo',  type: 'text', rows: 3 }),

    defineField({ name: 'rdEyebrow',  title: 'R&D — Eyebrow',      type: 'string' }),
    defineField({ name: 'rdTitle',    title: 'R&D — Titolo',        type: 'text', rows: 2 }),
    defineField({ name: 'rdSubtitle', title: 'R&D — Sottotitolo',   type: 'text', rows: 3 }),

    defineField({ name: 'missionTitle',    title: 'Mission — Titolo',      type: 'text', rows: 3 }),
    defineField({ name: 'missionSubtitle', title: 'Mission — Sottotitolo', type: 'text', rows: 3 }),
    defineField({
      name: 'industries', title: 'Mission — Settori', type: 'array',
      of: [defineArrayMember({ type: 'string' })],
    }),

    defineField({ name: 'servicesEyebrow', title: 'Servizi — Eyebrow', type: 'string' }),
    defineField({
      name: 'services', title: 'Servizi', type: 'array',
      of: [defineArrayMember({
        type: 'object',
        fields: [
          defineField({ name: 'title',       type: 'string', title: 'Titolo' }),
          defineField({ name: 'description', type: 'text',   title: 'Descrizione', rows: 3 }),
        ],
      })],
    }),

    defineField({ name: 'contactEyebrow',  title: 'Contatti — Eyebrow',     type: 'string' }),
    defineField({ name: 'contactTitle',    title: 'Contatti — Titolo',       type: 'text', rows: 3 }),
    defineField({ name: 'contactSubtitle', title: 'Contatti — Sottotitolo',  type: 'text', rows: 3 }),

    defineField({ name: 'companyName', title: 'Azienda — Nome',      type: 'string' }),
    defineField({ name: 'taxId',       title: 'Azienda — P.IVA',     type: 'string' }),
    defineField({ name: 'address',     title: 'Azienda — Indirizzo', type: 'string' }),
    defineField({ name: 'city',        title: 'Azienda — Città',     type: 'string' }),
    defineField({ name: 'email',       title: 'Contatto — Email',    type: 'string' }),
    defineField({ name: 'linkedinUrl', title: 'Contatto — LinkedIn', type: 'url' }),
  ],
});
