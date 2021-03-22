import React from 'react';
import userStore from './store/user';
import todoStore from './store/todo';
import 'bootstrap/dist/css/bootstrap.min.css';

class BaseComponent extends React.PureComponent {
  rerender = () => {
    this.setState({
      _rerender: new Date(),
    });
  }
}
class App extends BaseComponent {
  state = {
    isInitialized: false
  }

  async componentDidMount() {
    console.log('didmount')
    await userStore.initialize();
    this.setState({
      isInitialized: true,
    });
    if(!userStore.data.email){
      await userStore.editSingle({
        id:'achmad17nov',
        email:'achmad17nov@gmail.com',
      });
    }
    this.unsubUser = userStore.subscribe(this.rerender);
  }

  async componentDidUpdate() {
    if (!todoStore.isInitialized) {
      console.log('popup initialize all offline data...');
      todoStore.setName('achmad17nov');
      await todoStore.initialize();
      console.log('popup done');
    }
  }

  componentWillUnmount() {
    this.unsubUser();
  }

  render(){
    if(!this.state.isInitialized) return null;

    return(<>
      <ListTask />
    </>)
  }
}

class ListTask extends BaseComponent {
  state = {
    input_text: '',
    onEdit: {
      status: false,
      todoOnEdit: {}
    }
  }

  defaultState = this.state;

  checkIsUploaded(doc) {
    const dirtyAt = doc.dirtyAt;
    if (dirtyAt && new Date(dirtyAt) <= new Date(todoStore.dataMeta.tsUpload)) {
      return true;
    }

    return false;
  }

  componentDidMount() {
    this.unsubTodos = todoStore.subscribe(this.rerender);
  }

  componentWillUnmount() {
    this.unsubTodos();
  }

  setInput_text = (event) => {
    this.setState({
      input_text: event.target.value,
    });
  }

  onClickEdit = (todo) => {
    this.setState({
      onEdit: {
        status: true,
        todoOnEdit: todo
      }
    })
  }

  changeInput = (e) => {
    this.setState({
      onEdit: {
        ...this.state.onEdit,
        todoOnEdit: {
          ...this.state.onEdit.todoOnEdit,
          text: e.target.value
        }
      }
    })
  }

  addTodo = async () => {
    await todoStore.addItem({
      text: this.state.input_text,
      is_complete: false,
    }, userStore.data);
    this.setState({ input_text: '' });
  }

  deleteTodo = async (id) => {
    await todoStore.deleteItem(id, userStore.data);
  }

  editTodo = async (id) => {
    if(!this.state.onEdit.todoOnEdit._id) return alert('Please edit 1 row')

    const payload = {
      text: this.state.onEdit.todoOnEdit.text
    }
    await todoStore.editItem(id, payload, userStore.data);
    this.setState({
      onEdit: {
        status: false,
        todoOnEdit: {}
      }
    })
  }

  upload = async () => {
    console.log('uploading...');
    try {
      await todoStore.upload();
      console.log('upload done');
    } catch (err) {
      alert(err.message);
      console.log('upload failed');
    }
  }

  render() {
    const { status, todoOnEdit } = this.state.onEdit; 

    return (
      <div style={{width: '900px'}}>
        <div className="d-flex flex-row">
          <div className="d-flex flex-row flex-fill p-3">
            <input className="mr-2 " type="text" value={this.state.input_text} onChange={e => this.setInput_text(e)}></input>
            <button type="button" className="btn btn-primary" onClick={e => this.addTodo()}>Add Todo</button>
          </div>
          <div className="d-flex flex-fill p-3 justify-content-end">
            <button type="button" className="btn btn-success" onClick={e => this.upload()}>Sync</button>
          </div>
        </div>
        
        <div className="d-flex flex-column">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Todo</th>
                <th scope="col">Status</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              { todoStore.data.map((todo, idx) => (
                <tr key={todo._id}>
                  <th scope="row">{idx + 1}</th>
                  <td>
                    {
                      (status && todoOnEdit._id === todo._id) ? 
                      <input type="text" defaultValue={todo.text} onChange={e => this.changeInput(e)}></input> :
                      <span>{todo.text}</span>
                    }
                  </td>
                  <td>{!this.checkIsUploaded(todo)?`Belum upload`:'Sudah upload'}</td>
                  <td>
                    { status && todoOnEdit._id === todo._id  && (<>
                      <button type="button" className="btn btn-warning mx-2" onClick={e => this.setState({ ...this.defaultState })}>Cancel</button>
                      <button type="button" className="btn btn-success" onClick={e => this.editTodo(todo._id)}>Save</button>
                    </>
                    ) }
                    { todoOnEdit._id !== todo._id && (<>
                      <button type="button" className="btn btn-danger mx-2" onClick={e => this.deleteTodo(todo._id)}>Delete</button>
                      <button type="button" className="btn btn-primary" onClick={e => this.onClickEdit(todo)}>Edit</button>
                    </>)  }
                  </td>
                </tr>
                )
              )
              }
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

export default App;