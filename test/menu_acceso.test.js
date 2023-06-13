// During the test the env variable is set to test
process.env.NODE_ENV = 'test';

// Require the dev-dependencies
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../server');

const should = chai.should();

chai.use(chaiHttp);
// Our parent block
describe('menu_acceso', () => {
  /*
   * Test the /GET route
   */
  describe('/GET menu_acceso', () => {
    it('deberia traer todos los libros', (done) => {
      chai
        .request(server)
        .get('/menu_acceso')
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('array');
          res.body.length.should.be.eql(0);
          done();
        });
    });
  });
  /*
   * Test the /POST route
   */
  describe('/POST menu_acceso', () => {
    it('it should not POST a book without pages field', (done) => {
      const book = {
        menu_codigo: 'The Lord of the Rings',
        menu_etiqueta: 'J.R.R. Tolkien',
        nivel: '7',
        modulo: 'modulo 7',
        tipo_modulo: 'tipo modulo 7',
        imagen: 'imagen 7',
        ambito_acceso: 'ambito 7',
      };
      chai
        .request(server)
        .post('/menu_acceso')
        .send(book)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('error');
          res.body.error.should.be.an('array');
          done();
        });
    });
  });
});
