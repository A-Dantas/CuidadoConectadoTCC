import { Paciente } from '../../features/system/gestor/paciente.service';
import { Usuario } from '../../features/system/gestor/usuario.service';

export const INITIAL_USUARIOS: Usuario[] = [
    {
        userName: 'Gestor',
        email: 'gestor@cuidado.com',
        role: 'Manager',
        login: 'gestor',
        password: '123',
        rua: 'Rua Principal', numero: '1', bairro: 'Centro', cidade: 'Magruas', estado: 'SP', endereco: 'Rua Principal, 1',
        status: 'active'
    },
    {
        userName: 'Luisane',
        sobrenome: 'Ferreira',
        email: 'luisane@email.com',
        role: 'Family Member',
        login: 'luisane1234',
        password: '123',
        tipoUsuario: 'familiar',
        cpfPacienteResponsavel: '111.111.111-11',
        telefone: '(11) 91111-1111',
        whatsapp: '(11) 91111-1111',
        status: 'active',
        rua: 'Rua das Flores', numero: '10', bairro: 'Bairro Rosa', cidade: 'Magruas', estado: 'SP', endereco: 'Rua das Flores, 10'
    },
    {
        userName: 'Mariana',
        sobrenome: 'Silva',
        email: 'mariana@email.com',
        role: 'Family Member',
        login: 'mariana1234',
        password: '123',
        tipoUsuario: 'familiar',
        cpfPacienteResponsavel: '222.222.222-22',
        telefone: '(11) 94444-4444',
        whatsapp: '(11) 94444-4444',
        status: 'active',
        rua: 'Rua das Palmeiras', numero: '25', bairro: 'Jardim Planalto', cidade: 'Magruas', estado: 'SP', endereco: 'Rua das Palmeiras, 25'
    },
    {
        userName: 'Kelvin',
        sobrenome: 'Oliveira',
        email: 'kelvin@email.com',
        role: 'Caregiver',
        login: 'kelvin1234',
        password: '123',
        tipoUsuario: 'cuidador',
        telefone: '(11) 92222-2222',
        whatsapp: '(11) 92222-2222',
        tempoExperiencia: '5 anos',
        chavePix: 'kelvin@pix.com',
        experienciaComorbidadesList: ['Alzheimer', 'Diabetes'],
        status: 'active',
        rua: 'Av. Brasil', numero: '500', bairro: 'Jardins', cidade: 'São Paulo', estado: 'SP', endereco: 'Av. Brasil, 500'
    },
    {
        userName: 'Ricardo',
        sobrenome: 'Santos',
        email: 'ricardo@email.com',
        role: 'Caregiver',
        login: 'ricardo1234',
        password: '123',
        tipoUsuario: 'cuidador',
        telefone: '(11) 95555-5555',
        whatsapp: '(11) 95555-5555',
        tempoExperiencia: '3 anos',
        chavePix: 'ricardo@pix.com',
        experienciaComorbidadesList: ['Hipertensão'],
        status: 'active',
        rua: 'Rua Operária', numero: '12', bairro: 'Distrito', cidade: 'São Paulo', estado: 'SP', endereco: 'Rua Operária, 12'
    },
    {
        userName: 'Bianca',
        sobrenome: 'Medeiros',
        email: 'bianca@email.com',
        role: 'Doctor',
        login: 'bianca1234',
        password: '123',
        tipoUsuario: 'medico',
        telefone: '(11) 93333-3333',
        whatsapp: '(11) 93333-3333',
        status: 'active',
        rua: 'Rua Médica', numero: '100', bairro: 'Saúde', cidade: 'São Paulo', estado: 'SP', endereco: 'Rua Médica, 100'
    },
    {
        userName: 'Dr. Fernando',
        sobrenome: 'Costa',
        email: 'fernando@email.com',
        role: 'Doctor',
        login: 'fernando1234',
        password: '123',
        tipoUsuario: 'medico',
        telefone: '(11) 96666-6666',
        whatsapp: '(11) 96666-6666',
        status: 'active',
        rua: 'Av. Paulista', numero: '1500', bairro: 'Bela Vista', cidade: 'São Paulo', estado: 'SP', endereco: 'Av. Paulista, 1500'
    }
];

export const INITIAL_PACIENTES: Paciente[] = [
    {
        nomePaciente: 'João da Silva',
        cpf: '111.111.111-11',
        idade: 85,
        dataNascimento: '10/10/1938',
        rua: 'Rua XV de Novembro',
        numero: '100',
        bairro: 'Centro',
        cidade: 'Magruas',
        estado: 'SP',
        endereco: 'Rua XV de Novembro, 100, Centro, Magruas, SP',
        comorbidades: 'Alzheimer, Diabetes',
        cuidadorAtribuido: 'Cuidador de Teste',
        medicoAtribuido: 'Dr. Médico Teste',
        contatoFamiliar: 'Responsável Familiar'
    }
];

export const INITIAL_SCHEDULES = [
    {
        cuidador: 'Kelvin',
        day: 10,
        patient: 'João da Silva',
        shift: '24H_7H'
    },
    {
        cuidador: 'Kelvin',
        day: 12,
        patient: 'João da Silva',
        shift: 'MT'
    }
];
