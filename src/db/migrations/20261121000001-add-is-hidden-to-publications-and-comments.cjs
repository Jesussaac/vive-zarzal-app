'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('publications', 'is_hidden', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addColumn('comments', 'is_hidden', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addIndex('publications', ['is_hidden']);
    await queryInterface.addIndex('comments', ['is_hidden']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('comments', ['is_hidden']);
    await queryInterface.removeIndex('publications', ['is_hidden']);
    await queryInterface.removeColumn('comments', 'is_hidden');
    await queryInterface.removeColumn('publications', 'is_hidden');
  },
};
